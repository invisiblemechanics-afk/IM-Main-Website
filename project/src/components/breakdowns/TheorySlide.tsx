import React from 'react';
import styles from './breakdowns.module.css';
import { TheorySlide as TheorySlideType } from './types';
import { FirebaseImage } from './FirebaseImage';
import { LaTeXBlockRenderer } from '../LaTeXRenderer';

interface TheorySlideProps {
  slide: TheorySlideType;
}

export const TheorySlide: React.FC<TheorySlideProps> = ({ slide }) => {
  return (
    <>
      <div className={styles.theoryText}>
        <LaTeXBlockRenderer>{slide.html}</LaTeXBlockRenderer>
      </div>
      {slide.img && (
        <div className={styles.imageContainer}>
          <FirebaseImage 
            imagePath={slide.img}
            alt={slide.title}
            className={styles.slideImage}
          />
        </div>
      )}
    </>
  );
};