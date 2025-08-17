import React, { useState, useEffect } from 'react';
import styles from './breakdowns.module.css';
import { MCQSlide, NumericSlide, OptionState } from './types';
import { OptionBlock } from './OptionBlock';
import { Hint } from './Hint';
import { FirebaseImage } from './FirebaseImage';
import { evaluateSingle, evaluateMulti, evaluateNumeric } from './utils';
import { LaTeXRenderer } from '../LaTeXRenderer';
import { logSlideCheck } from '@/utils/debug';

interface QuestionSlideProps {
  slide: MCQSlide | NumericSlide;
  savedAnswer?: number[] | number;
  savedState?: OptionState | OptionState[];
  onSubmit: (answer: number[] | number, state: OptionState | OptionState[]) => void;
}

export const QuestionSlide: React.FC<QuestionSlideProps> = ({ 
  slide, 
  savedAnswer,
  savedState,
  onSubmit 
}) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [numericValue, setNumericValue] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const initialOptionCount = (slide.type !== 'numeric' ? (slide as MCQSlide).options?.length : 0) || 4;
  const [optionStates, setOptionStates] = useState<OptionState[]>(
    Array(initialOptionCount).fill('neutral')
  );

  // Initialize from saved state
  useEffect(() => {
    if (savedAnswer !== undefined) {
      if (slide.type === 'numeric') {
        setNumericValue(savedAnswer.toString());
      } else if (Array.isArray(savedAnswer)) {
        setSelectedOptions(savedAnswer);
      } else {
        setSelectedOptions([savedAnswer]);
      }
      // Only set as submitted if there's both an answer and a state (meaning it was actually submitted)
      setIsSubmitted(savedState !== undefined);
    } else {
      // Reset state when no saved answer
      setIsSubmitted(false);
      setNumericValue('');
      setSelectedOptions([]);
      setOptionStates(Array(4).fill('neutral'));
    }
    if (savedState) {
      if (Array.isArray(savedState)) {
        setOptionStates(savedState);
      }
    }
  }, [savedAnswer, savedState, slide.type]);

  const handleOptionClick = (index: number) => {
    if (isSubmitted) return;

      if (slide.type === 'mcq-single') {
      setSelectedOptions([index]);
      // Apply purple state immediately for selected option
        const newStates = Array((slide as MCQSlide).options?.length || 4).fill('neutral') as OptionState[];
      newStates[index] = 'purple';
      setOptionStates(newStates);
    } else if (slide.type === 'mcq-multi') {
      const newSelected = selectedOptions.includes(index)
        ? selectedOptions.filter(i => i !== index)
        : [...selectedOptions, index];
      setSelectedOptions(newSelected);
      // Apply purple state for selected options
        const newStates = Array((slide as MCQSlide).options?.length || 4).fill('neutral') as OptionState[];
      newSelected.forEach(i => newStates[i] = 'purple');
      setOptionStates(newStates);
    }
  };

  const handleSubmit = () => {
    const nq = (slide as any).normalizedQuestion;
    
    if (slide.type === 'numeric') {
      const numericSlide = slide as NumericSlide;
      const answer = numericSlide.answer;
      const values = Array.isArray(answer) 
        ? numericValue.split(',').map(v => parseFloat(v.trim()))
        : parseFloat(numericValue);
      const state = evaluateNumeric(
        answer as any,
        values as any,
        { min: numericSlide.rangeMin, max: numericSlide.rangeMax }
      );
      onSubmit(values, state);
      setIsSubmitted(true);
    } else if (nq) {
      // Use normalized question data (0-based consistently)
      const { type, choices, correctIndex, correctIndices } = nq;
      
      if (type === 'MCQ') {
        const chosen = selectedOptions[0];
        const isCorrect = correctIndex !== undefined && chosen === correctIndex;
        
        logSlideCheck(slide);
        
        const newStates = Array(choices.length).fill('neutral') as OptionState[];
        newStates[chosen] = isCorrect ? 'green' : 'red';
        
        // If incorrect, also mark the correct option green
        if (!isCorrect && correctIndex !== undefined && correctIndex >= 0 && correctIndex < newStates.length) {
          newStates[correctIndex] = 'green';
        }
        
        setOptionStates(newStates);
        onSubmit(chosen, newStates[chosen]);
      } else if (type === 'MultipleAnswer') {
        // Use normalized indices (already 0-based)
        const states = evaluateMulti(correctIndices || [], selectedOptions, choices.length);
        setOptionStates(states);
        onSubmit(selectedOptions, states);
      }
      setIsSubmitted(true);
    }
  };

  const canSubmit = slide.type === 'numeric' 
    ? numericValue.trim() !== ''
    : (slide.type === 'mcq-single' ? selectedOptions.length === 1 : selectedOptions.length > 0);

  return (
    <>
      <p className={styles.questionText}>
        <LaTeXRenderer>{slide.question}</LaTeXRenderer>
      </p>
      
      {slide.img && (
        <div className={styles.imageContainer}>
          <FirebaseImage 
            imagePath={slide.img}
            alt={slide.title}
            className={styles.slideImage}
          />
        </div>
      )}

      {slide.type === 'numeric' ? (
        <div>
          <input
            type="text"
            value={numericValue}
            onChange={(e) => setNumericValue(e.target.value)}
            placeholder="Type your answer"
            className={`${styles.numericInput} ${
              isSubmitted && savedState ? styles[savedState as OptionState] : ''
            }`}
            disabled={isSubmitted}
          />
          {Array.isArray((slide as NumericSlide).answer) && (
            <p className="text-sm text-gray-600 mt-2">
              Separate multiple values with commas
            </p>
          )}
        </div>
      ) : (
        <div>
          {(() => {
            const nq = (slide as any).normalizedQuestion;
            const choices = nq?.choices || (slide as MCQSlide).options || [];
            return choices.map((option: string, index: number) => (
              <OptionBlock
                key={index}
                text={option}
                state={optionStates[index]}
                onClick={() => handleOptionClick(index)}
                isMulti={slide.type === 'mcq-multi'}
                isSelected={selectedOptions.includes(index)}
                isSubmitted={isSubmitted}
              />
            ));
          })()}
        </div>
      )}

      <div className={styles.buttonContainer}>
        <div className={styles.submitSection}>
          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={styles.submitButton}
            >
              Submit
            </button>
          )}
        </div>
        
        <div className={styles.hintSection}>
          {slide.hint && (
            <button
              onClick={() => setShowHint(true)}
              className={styles.hintButton}
            >
              💡 Hint
            </button>
          )}
        </div>
      </div>

      {showHint && slide.hint && (
        <Hint text={slide.hint} onClose={() => setShowHint(false)} />
      )}
    </>
  );
};