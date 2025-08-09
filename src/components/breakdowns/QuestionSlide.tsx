import React, { useState, useEffect } from 'react';
import styles from './breakdowns.module.css';
import { MCQSlide, NumericSlide, OptionState } from './types';
import { OptionBlock } from './OptionBlock';
import { Hint } from './Hint';
import { FirebaseImage } from './FirebaseImage';
import { evaluateSingle, evaluateMulti, evaluateNumeric } from './utils';
import { LaTeXRenderer } from '../LaTeXRenderer';

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
    } else {
      const mcqSlide = slide as MCQSlide;
      if (mcqSlide.type === 'mcq-single') {
        // Handle both 'correct' and 'answerIndex' fields
        let correctIndex: number;
        if ('answerIndex' in mcqSlide && mcqSlide.answerIndex !== undefined) {
          correctIndex = Number((mcqSlide as any).answerIndex);
          console.log('QuestionSlide - Using answerIndex:', correctIndex);
        } else if (mcqSlide.correct && mcqSlide.correct.length > 0) {
          correctIndex = Number(mcqSlide.correct[0]);
          console.log('QuestionSlide - Using correct[0]:', correctIndex);
        } else {
          correctIndex = 0;
          console.log('QuestionSlide - No answer found, defaulting to 0');
        }
        
        const chosen = Number(selectedOptions[0]);
        console.log('QuestionSlide - chosen:', chosen, 'correctIndex:', correctIndex);
        
        // Check if answer is correct (handle both 0-based and 1-based indexing)
        const isCorrect = correctIndex === chosen || correctIndex === chosen + 1;
        console.log('QuestionSlide - isCorrect:', isCorrect);
        
        const newStates = Array((mcqSlide.options?.length ?? 4)).fill('neutral') as OptionState[];
        newStates[selectedOptions[0]] = isCorrect ? 'green' : 'red';
        
        // If incorrect, also mark the correct option green
        if (!isCorrect) {
          // If correct answer is 1-based, convert to 0-based for display
          const correctDisplayIndex = correctIndex > 0 && correctIndex <= (mcqSlide.options?.length || 4) 
            ? correctIndex - 1 
            : correctIndex;
          if (correctDisplayIndex >= 0 && correctDisplayIndex < newStates.length) {
            newStates[correctDisplayIndex] = 'green';
          }
        }
        
        setOptionStates(newStates);
        onSubmit(selectedOptions[0], newStates[selectedOptions[0]]);
      } else {
        // Handle multi-answer MCQ
        let correctArray: number[];
        if ('answerIndices' in mcqSlide && (mcqSlide as any).answerIndices) {
          correctArray = (mcqSlide as any).answerIndices.map((v: any) => Number(v));
          console.log('QuestionSlide Multi - Using answerIndices:', correctArray);
        } else if (mcqSlide.correct) {
          correctArray = mcqSlide.correct.map((v) => Number(v));
          console.log('QuestionSlide Multi - Using correct:', correctArray);
        } else {
          correctArray = [];
          console.log('QuestionSlide Multi - No answer found');
        }
        
        // Normalize to 0-based if needed (defensive)
        const optionsLen = mcqSlide.options?.length || 4;
        const hasZero = correctArray.includes(0);
        const min = correctArray.length ? Math.min(...correctArray) : 0;
        const max = correctArray.length ? Math.max(...correctArray) : 0;
        const looksOneBased = !hasZero && min >= 1 && max <= optionsLen;
        const normalizedCorrect = looksOneBased ? correctArray.map(v => v - 1) : correctArray;
        const states = evaluateMulti(normalizedCorrect, selectedOptions.map(v => Number(v)), optionsLen);
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
          {(slide as MCQSlide).options.map((option, index) => (
            <OptionBlock
              key={index}
              text={option}
              state={optionStates[index]}
              onClick={() => handleOptionClick(index)}
              isMulti={slide.type === 'mcq-multi'}
              isSelected={selectedOptions.includes(index)}
              isSubmitted={isSubmitted}
            />
          ))}
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