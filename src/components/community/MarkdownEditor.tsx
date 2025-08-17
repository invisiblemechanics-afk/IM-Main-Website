import React, { useState, useRef } from 'react';
import { 
  EyeIcon,
  EyeSlashIcon,
  LinkIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { 
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote
} from 'lucide-react';
import { sanitizeMarkdown } from '@/lib/community/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  value, 
  onChange, 
  placeholder,
  minHeight = 150,
  maxHeight = 500
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => insertMarkdown('**', '**');
  const handleItalic = () => insertMarkdown('*', '*');
  const handleCode = () => insertMarkdown('`', '`');
  const handleLink = () => insertMarkdown('[', '](url)');
  const handleBulletList = () => insertMarkdown('\n- ');
  const handleNumberedList = () => insertMarkdown('\n1. ');
  const handleQuote = () => insertMarkdown('\n> ');

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 px-2 py-1 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleBold}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Bold"
            data-cursor="button"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleItalic}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Italic"
            data-cursor="button"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCode}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Code"
            data-cursor="button"
          >
            <CodeBracketIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLink}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Link"
            data-cursor="button"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={handleBulletList}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Bullet List"
            data-cursor="button"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNumberedList}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Numbered List"
            data-cursor="button"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleQuote}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Quote"
            data-cursor="button"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1 text-sm"
          data-cursor="button"
        >
          {showPreview ? (
            <>
              <EyeSlashIcon className="w-4 h-4" />
              <span>Edit</span>
            </>
          ) : (
            <>
              <EyeIcon className="w-4 h-4" />
              <span>Preview</span>
            </>
          )}
        </button>
      </div>

      {/* Editor/Preview */}
      {showPreview ? (
        <div 
          className="p-4 prose prose-sm max-w-none"
          style={{ minHeight, maxHeight, overflowY: 'auto' }}
          dangerouslySetInnerHTML={{ __html: sanitizeMarkdown(value || '*No content*') }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 resize-none focus:outline-none"
          style={{ minHeight, maxHeight }}
        />
      )}
    </div>
  );
};
