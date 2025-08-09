export interface TheorySlide {
  id: string;
  type: 'theory';
  title: string;
  html: string;
  img?: string;
}

export interface MCQSlide {
  id: string;
  type: 'mcq-single' | 'mcq-multi';
  title: string;
  question: string;
  options: string[];
  correct: number[];
  hint?: string;
  img?: string;
}

export interface NumericSlide {
  id: string;
  type: 'numeric';
  title: string;
  question: string;
  answer: number | number[];
  // Optional inclusive range for validation
  rangeMin?: number;
  rangeMax?: number;
  hint?: string;
  img?: string;
}

export type Slide = TheorySlide | MCQSlide | NumericSlide;

export type OptionState = 'neutral' | 'green' | 'red' | 'yellow' | 'purple';

export interface SlideAnswer {
  slideId: string;
  chosen: number[] | number;
  state: OptionState | OptionState[];
}