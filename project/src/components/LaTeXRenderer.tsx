import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LaTeXRendererProps {
  children: string;
  className?: string;
  inline?: boolean;
}

/**
 * LaTeX Renderer Component
 * Automatically detects and renders LaTeX expressions in text
 * Supports both inline ($...$) and block ($$...$$) math expressions
 */
export const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ 
  children, 
  className = '', 
  inline = true 
}) => {
  if (!children) {
    return <span className={className}></span>;
  }

  // Regular expressions for LaTeX detection
  const blockMathRegex = /\$\$([^$]+)\$\$/g;
  const inlineMathRegex = /\$([^$]+)\$/g;

  // Check if the text contains any LaTeX
  const hasBlockMath = blockMathRegex.test(children);
  const hasInlineMath = inlineMathRegex.test(children);

  if (!hasBlockMath && !hasInlineMath) {
    // No LaTeX found, return plain text
    return <span className={className} dangerouslySetInnerHTML={{ __html: children }} />;
  }

  // Parse and render LaTeX expressions
  const renderMathContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let partIndex = 0;

    // First, handle block math ($$...$$)
    let processedText = text;
    const blockMatches: Array<{ match: string; formula: string; index: number }> = [];
    
    processedText.replace(blockMathRegex, (match, formula, index) => {
      blockMatches.push({ match, formula, index: index + lastIndex });
      return match;
    });

    // Process block matches from end to beginning to maintain indices
    blockMatches.reverse().forEach(({ match, formula, index }) => {
      const beforeBlock = processedText.substring(0, index);
      const afterBlock = processedText.substring(index + match.length);
      
      // Process inline math in the before part
      const beforeParts = processInlineMath(beforeBlock, partIndex);
      parts.unshift(...beforeParts.reverse());
      partIndex += beforeParts.length;

      // Add block math
      try {
        parts.unshift(
          <div key={`block-${partIndex++}`} className="my-2">
            <BlockMath math={formula.trim()} />
          </div>
        );
      } catch (error) {
        console.warn('LaTeX block math render error:', error);
        parts.unshift(
          <span key={`block-error-${partIndex++}`} className="text-red-500">
            [LaTeX Error: {formula}]
          </span>
        );
      }

      processedText = afterBlock;
    });

    // Process remaining text for inline math
    if (processedText) {
      const remainingParts = processInlineMath(processedText, partIndex);
      parts.unshift(...remainingParts.reverse());
    }

    return parts.reverse();
  };

  const processInlineMath = (text: string, startIndex: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let partIndex = startIndex;

    text.replace(inlineMathRegex, (match, formula, index) => {
      // Add text before the math
      if (index > lastIndex) {
        const beforeText = text.substring(lastIndex, index);
        if (beforeText) {
          parts.push(
            <span key={`text-${partIndex++}`} dangerouslySetInnerHTML={{ __html: beforeText }} />
          );
        }
      }

      // Add the math
      try {
        parts.push(
          <InlineMath key={`math-${partIndex++}`} math={formula.trim()} />
        );
      } catch (error) {
        console.warn('LaTeX inline math render error:', error);
        parts.push(
          <span key={`math-error-${partIndex++}`} className="text-red-500">
            [LaTeX Error: {formula}]
          </span>
        );
      }

      lastIndex = index + match.length;
      return match;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(
          <span key={`text-final-${partIndex++}`} dangerouslySetInnerHTML={{ __html: remainingText }} />
        );
      }
    }

    return parts;
  };

  const renderedContent = renderMathContent(children);

  return (
    <span className={className}>
      {renderedContent}
    </span>
  );
};

/**
 * Block LaTeX Renderer for larger content areas
 */
export const LaTeXBlockRenderer: React.FC<Omit<LaTeXRendererProps, 'inline'>> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      <LaTeXRenderer inline={false}>{children}</LaTeXRenderer>
    </div>
  );
};