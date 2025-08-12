import { Timestamp } from 'firebase/firestore';

export interface Author {
  id: string;               // stable userId from existing auth
  username: string;         // REQUIRED for every post/comment
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface BreakdownContext {
  problemId: string;
  slideId: string;
  snapshotUrl?: string | null; // optional fallback image
}

export interface Thread {
  id: string;                 // doc id
  title: string;
  bodyMarkdown: string;
  bodyHtmlSanitized: string;  // sanitize on server
  images: string[];           // URLs (reuse existing uploader)
  tags: string[];
  author: Author;             // must include username
  createdAt: Timestamp;
  updatedAt: Timestamp;
  score: number;              // denormalized vote total
  commentCount: number;       // denormalized
  hotRank: number;            // for "Hot" sorting (precomputed on writes)
  slug: string;
  breakdown?: BreakdownContext | null;
}

export interface Comment {
  id: string;                 // doc id
  threadId: string;
  parentId?: string | null;   // null for top-level
  bodyMarkdown: string;
  bodyHtmlSanitized: string;
  author: Author;             // must include username
  createdAt: Timestamp;
  updatedAt: Timestamp;
  score: number;              // denormalized vote total
}

export interface Vote {
  userId: string;             // doc id for votes subcollection = voter's userId
  value: 1 | -1;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper function to compute hot rank
export function computeHotRank(score: number, createdAtMs: number): number {
  const hours = Math.max(0, (Date.now() - createdAtMs) / 3600000);
  return score / (Math.pow(hours + 2, 0.8));
}
