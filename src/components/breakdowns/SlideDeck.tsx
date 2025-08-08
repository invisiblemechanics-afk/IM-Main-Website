import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './breakdowns.module.css';
import { Slide, SlideAnswer, OptionState } from './types';
import { TheorySlide } from './TheorySlide';
import { QuestionSlide } from './QuestionSlide';
import { useSlideNav } from './useSlideNav';
import { LaTeXRenderer } from '../LaTeXRenderer';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface SlideDeckProps {
  slides: Slide[];
  onBackToQuestion?: () => void;
}

export const SlideDeck: React.FC<SlideDeckProps> = ({ slides, onBackToQuestion }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SlideAnswer[]>([]);

  // Handle empty slides array
  if (!slides || slides.length === 0) {
    return (
      <div className={styles.slideContainer}>
        <div className={styles.slideHeader}>
          <button
            onClick={() => onBackToQuestion ? onBackToQuestion() : navigate(-1)}
            className={styles.backButton}
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Main Problem
          </button>
          <h2 className={styles.slideTitle}>No Slides Available</h2>
        </div>
        <div className="text-center py-12 text-gray-500">
          <p>No slides are available for this question yet.</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];
  const savedAnswer = answers.find(a => a.slideId === currentSlide.id);

  const handleBack = useCallback(() => {
    // Use the callback to go back to the main problem view
    if (onBackToQuestion) {
      onBackToQuestion();
    } else {
      // Fallback to browser navigation if callback not provided
      navigate(-1);
    }
  }, [onBackToQuestion, navigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useSlideNav(handleNext, handlePrev);

  const handleQuestionSubmit = (answer: number[] | number, state: OptionState | OptionState[]) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.slideId !== currentSlide.id);
      return [...filtered, {
        slideId: currentSlide.id,
        chosen: answer,
        state
      }];
    });
  };

  return (
    <div className={styles.slideContainer}>
      <div className={styles.slideHeader}>
        <button
          onClick={handleBack}
          className={styles.backButton}
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Main Problem
        </button>
        <h2 className={styles.slideTitle}>
          <LaTeXRenderer>{currentSlide.title}</LaTeXRenderer>
        </h2>
        <div className={styles.progressIndicator}>
          Page {currentIndex + 1} / {slides.length}
        </div>
      </div>

      <div className={styles.slideContent}>
        {currentSlide.type === 'theory' ? (
          <TheorySlide slide={currentSlide} />
        ) : (
          <QuestionSlide
            slide={currentSlide}
            savedAnswer={savedAnswer?.chosen}
            savedState={savedAnswer?.state}
            onSubmit={handleQuestionSubmit}
          />
        )}
      </div>

      <div className={styles.navigation}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={styles.navButton}
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === slides.length - 1}
          className={styles.navButton}
        >
          Next
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};