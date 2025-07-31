import React, { useState, useEffect } from 'react';
import styles from './breakdowns.module.css';
import { MCQSlide, NumericSlide, OptionState } from './types';
import { OptionBlock } from './OptionBlock';
import { Hint } from './Hint';
import { FirebaseImage } from './FirebaseImage';
import { evaluateSingle, evaluateMulti, evaluateNumeric } from './utils';

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
  const [optionStates, setOptionStates] = useState<OptionState[]>(
    Array(4).fill('neutral')
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
      const newStates = Array(4).fill('neutral') as OptionState[];
      newStates[index] = 'purple';
      setOptionStates(newStates);
    } else if (slide.type === 'mcq-multi') {
      const newSelected = selectedOptions.includes(index)
        ? selectedOptions.filter(i => i !== index)
        : [...selectedOptions, index];
      setSelectedOptions(newSelected);
      // Apply purple state for selected options
      const newStates = Array(4).fill('neutral') as OptionState[];
      newSelected.forEach(i => newStates[i] = 'purple');
      setOptionStates(newStates);
    }
  };

  const handleSubmit = () => {
    if (slide.type === 'numeric') {
      const answer = (slide as NumericSlide).answer;
      const values = Array.isArray(answer) 
        ? numericValue.split(',').map(v => parseFloat(v.trim()))
        : parseFloat(numericValue);
      const state = evaluateNumeric(answer, values);
      onSubmit(values, state);
      setIsSubmitted(true);
    } else {
      const mcqSlide = slide as MCQSlide;
      if (mcqSlide.type === 'mcq-single') {
        const state = evaluateSingle(mcqSlide.correct[0], selectedOptions[0]);
        const newStates = Array(4).fill('neutral') as OptionState[];
        newStates[selectedOptions[0]] = state;
        setOptionStates(newStates);
        onSubmit(selectedOptions[0], state);
      } else {
        const states = evaluateMulti(mcqSlide.correct, selectedOptions);
        setOptionStates(states);
        onSubmit(selectedOptions, states);
      }
      setIsSubmitted(true);
    }
  };

  const canSubmit = slide.type === 'numeric' 
    ? numericValue.trim() !== ''
    : selectedOptions.length > 0;

  return (
    <div className={styles.slideContent}>
      <p className={styles.questionText}>{slide.question}</p>
      
      {slide.img && (
        <div className={styles.imageContainer}>
          <FirebaseImage 
            imagePath="breakdowns-sample-image.png"
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
    </div>
  );
};