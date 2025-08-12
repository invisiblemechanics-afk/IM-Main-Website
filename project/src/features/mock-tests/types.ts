export type DifficultySplit = { 
  easy: number; 
  moderate: number; 
  tough: number; 
}; // sum 100

export type TypeSplit = { 
  MCQ: number; 
  MultipleAnswer: number; 
  Numerical: number; 
}; // sum == totalQuestions

export type TestBuilderState = {
  name: string;
  exam: 'JEE Main' | 'JEE Advanced' | 'NEET';
  durationMin: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  usePerQuestionMarks: boolean;  // true = auto
  marksCorrect?: number;         // when manual
  marksWrong?: number;           // when manual
  totalQuestions: number;
  difficulty: DifficultySplit;
  types: TypeSplit;
  skillTags: string[];           // global tags
};

export interface MockTest {
  id: string;
  name: string;
  exam: 'JEE Main' | 'JEE Advanced' | 'NEET';
  duration: number;
  totalQuestions: number;
  difficulty: DifficultySplit;
  skillTags: string[];
  syllabusChapters?: string[]; // Chapters from Firestore syllabus
  chapterTopics?: Record<string, string[]>; // Organized topics by chapter
  createdBy: 'admin' | 'user';
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testName: string;
  exam: string;
  startedAt: string;
  completedAt?: string;
  answers: Record<number, any>;
  markedForReview: number[];
  timeSpent: Record<number, number>;
  totalTimeSpent: number;
  score?: number;
  totalQuestions: number;
}

export interface QuestionState {
  index: number;
  status: 'unseen' | 'seen' | 'answered' | 'marked';
  answer?: any;
  timeSpent: number;
  isMarkedForReview: boolean;
}

export interface TestResult {
  attemptId: string;
  testName: string;
  exam: string;
  score: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  averageTimePerQuestion: number;
  totalTime: number;
  difficultyPerformance: Record<string, { correct: number; total: number }>;
  topicPerformance: Record<string, { correct: number; total: number }>;
  typePerformance: Record<string, { correct: number; total: number }>;
}
