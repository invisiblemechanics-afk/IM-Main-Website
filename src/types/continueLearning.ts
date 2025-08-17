export type VideoProgressDoc = {
  videoId: string;
  topicId: string;
  title?: string;
  positionSec: number;
  durationSec: number;
  progressPct: number;       // 0–100
  createdAt: any;
  updatedAt: any;
};

export type PracticeSessionDoc = {
  topicId: string;
  mode: 'practice';
  lastQuestionId?: string;
  answeredCount: number;
  totalCount?: number;
  accuracy?: number;
  status: 'in_progress' | 'completed';
  topicName?: string;
  createdAt: any;
  updatedAt: any;
};

