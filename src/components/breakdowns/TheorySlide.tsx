import React from 'react';
import styles from './breakdowns.module.css';
import { TheorySlide as TheorySlideType } from './types';
import { FirebaseImage } from './FirebaseImage';

interface TheorySlideProps {
  slide: TheorySlideType;
}

export const TheorySlide: React.FC<TheorySlideProps> = ({ slide }) => {
  return (
    <div className={styles.slideContent}>
      <div 
        className={styles.theoryText}
        dangerouslySetInnerHTML={{ __html: slide.html }}
      />
      {slide.img && (
        <div className={styles.imageContainer}>
          <FirebaseImage 
            imagePath="breakdowns-sample-image.png"
            alt={slide.title}
            className={styles.slideImage}
          />
        </div>
      )}
    </div>
  );
};