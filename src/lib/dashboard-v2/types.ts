export type TargetExam = 'JEE Main' | 'JEE Advanced' | string;

export interface UserProfile {
  uid: string;
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  targetExam?: TargetExam;
  attemptYear?: number;
  referralCode?: string;
  createdAt?: number | string | Date;
  updatedAt?: number | string | Date;
  onboarded?: boolean;
  examDate?: string; // optional ISO; if present, use for countdown
}

export interface Playlist {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  topicTags?: string[];
  createdAt?: number | string | Date;
  totalItems?: number;
  completedItems?: number;
  lastAccessedAt?: number | string | Date;
  // add any existing fields you already store; keep optional
}

export interface VideoProgress {
  userId: string;
  topicId: string;
  videoId?: string;
  progressPct?: number; // 0-100
  updatedAt?: number | string | Date;
  title?: string; // optional nicety for Continue Learning
}

export interface UserAnswer {
  userId: string;
  questionId: string;
  breakdownId?: string;
  isCorrect?: boolean;
  subject?: string;
  topic?: string;
  createdAt?: number | string | Date;
}

export interface MockTestAttempt {
  id: string;
  userId: string;
  testId: string;
  score?: number;           // 0-100
  accuracy?: number;        // 0-1 or 0-100; we'll normalize
  durationSec?: number;
  createdAt?: number | string | Date;
  subjectBreakup?: Record<string, number>;
}

export interface DiagnosticResult {
  id: string;
  userId: string;
  score?: number;         // 0-100
  createdAt?: number | string | Date;
  subjectBreakup?: Record<string, number>;
}

export interface ActivityEvent {
  ts: Date;
  kind: 'video' | 'answer' | 'mock' | 'diagnostic' | 'playlist';
}

export interface Trends {
  diagnostics: number[]; // recent scores
  mocks: number[];       // recent accuracies or scores
  completion: number[];  // recent topic/video completion pct
}

export interface QuickStats {
  playlistsCount: number;
  topicsCompleted: number;
  mockAttempts: number;
  communityContribs: number;
}

export interface Streak {
  current: number;
  longest: number;
}

export interface ContinueLearningItem {
  label: string;
  progressPct?: number;
  href: string;
}



