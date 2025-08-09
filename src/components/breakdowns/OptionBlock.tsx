import React from 'react';
import styles from './breakdowns.module.css';
import { OptionState } from './types';
import { CircularCheckbox } from '../CircularCheckbox';
import { LaTeXRenderer } from '../LaTeXRenderer';

interface OptionBlockProps {
  text: string;
  state: OptionState;
  onClick: () => void;
  isMulti?: boolean;
  isSelected?: boolean;
  // When false, we show selection as purple regardless of correctness states
  isSubmitted?: boolean;
}

export const OptionBlock: React.FC<OptionBlockProps> = ({ 
  text, 
  state, 
  onClick, 
  isMulti = false,
  isSelected = false,
  isSubmitted = false
}) => {
  const getClassName = () => {
    let classes = [styles.optionBlock];

    // Debug logging
    console.log('OptionBlock - isSubmitted:', isSubmitted, 'isSelected:', isSelected, 'state:', state);

    // Before submit: always show selected as purple, ignore correctness
    if (!isSubmitted) {
      if (isSelected) classes.push(styles.purple);
      return classes.join(' ');
    }

    // After submit: show correctness colors
    if (state !== 'neutral') classes.push(styles[state]);
    return classes.join(' ');
  };

  return (
    <div className={getClassName()} onClick={onClick}>
      <div className={isMulti ? styles.checkboxOption : styles.radioOption}>
        <CircularCheckbox
          checked={isSelected}
          onChange={() => {}} // Controlled by parent
        />
        <span><LaTeXRenderer>{text}</LaTeXRenderer></span>
      </div>
    </div>
  );
};