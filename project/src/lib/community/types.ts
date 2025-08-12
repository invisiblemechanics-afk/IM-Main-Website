import { Timestamp } from 'firebase/firestore';
import type { Thread as ThreadModel, Comment as CommentModel, Vote as VoteModel, Author as AuthorModel, BreakdownContext as BreakdownContextModel } from './models';

// Re-export from models for backward compatibility
export type Thread = ThreadModel;
export type Comment = CommentModel;
export type Vote = VoteModel;
export type Author = AuthorModel;
export type BreakdownContext = BreakdownContextModel;

// Legacy interfaces for compatibility
export interface ThreadLegacy {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string;
  title: string;
  bodyMarkdown: string;
  bodyHtmlSanitized: string;
  images: string[];
  tags: string[];
  score: number;
  commentCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  slug: string;
  breakdownContext?: BreakdownContext;
}

export interface CommentLegacy {
  id: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string;
  parentId: string | null;
  bodyMarkdown: string;
  bodyHtmlSanitized: string;
  score: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  childrenCount?: number;
}

export interface CommentWithChildren extends Comment {
  children?: CommentWithChildren[];
}

export interface ThreadListItem extends Thread {
  hasVoted?: 1 | -1 | null;
}

export interface ThreadDetail extends Thread {
  hasVoted?: 1 | -1 | null;
  comments?: CommentWithChildren[];
}

export type SortOption = 'hot' | 'new' | 'top';
export type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all';
