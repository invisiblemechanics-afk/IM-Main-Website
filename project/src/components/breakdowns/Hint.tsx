import React from 'react';
import styles from './breakdowns.module.css';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LaTeXRenderer } from '../LaTeXRenderer';

interface HintProps {
  text: string;
  onClose: () => void;
}

export const Hint: React.FC<HintProps> = ({ text, onClose }) => {
  return (
    <div className={styles.hintBox}>
      <button 
        className={styles.hintClose} 
        onClick={onClose}
        aria-label="Close hint"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
      <h4 className="font-semibold mb-2">Hint</h4>
      <p><LaTeXRenderer>{text}</LaTeXRenderer></p>
    </div>
  );
};