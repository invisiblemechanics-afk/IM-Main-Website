import React from 'react';
import styles from './breakdowns.module.css';
import { OptionState } from './types';
import { CircularCheckbox } from '../CircularCheckbox';

interface OptionBlockProps {
  text: string;
  state: OptionState;
  onClick: () => void;
  isMulti?: boolean;
  isSelected?: boolean;
}

export const OptionBlock: React.FC<OptionBlockProps> = ({ 
  text, 
  state, 
  onClick, 
  isMulti = false,
  isSelected = false 
}) => {
  const getClassName = () => {
    let classes = [styles.optionBlock];
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
        <span>{text}</span>
      </div>
    </div>
  );
};