import { Timestamp } from 'firebase/firestore';

export interface Chapter {
  name: string;
  slug: string;
  questionCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Breakdown {
  title: string;
  description: string;
  chapterId: string;
  type: 'MCQ' | 'MultiAnswer' | 'Numerical';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Slide {
  kind: 'theory' | 'question';
  title: string;
  content: string;
  imageUrl?: string;
  options?: string[];
  correct?: number[];
  answer?: number;
  hint?: string;
  createdAt: Timestamp;
}

export interface UserAnswerEntry {
  selected: number[];
  isCorrect: boolean;
  markedForReview: boolean;
  attemptedAt: Timestamp;
}

export interface UserAnswers {
  userId: string;
  breakdownId: string;
  answers: Record<string, UserAnswerEntry>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}