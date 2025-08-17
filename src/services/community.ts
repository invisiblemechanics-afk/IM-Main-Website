import { 
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { 
  createThread as firestoreCreateThread,
  getThreads as firestoreGetThreads,
  getThread as firestoreGetThread,
  createComment as firestoreCreateComment,
  getComments as firestoreGetComments,
  voteThread as firestoreVoteThread,
  voteComment as firestoreVoteComment,
  getUserVotes as firestoreGetUserVotes
} from '../lib/community/firestore';
import { Thread, Comment } from '../lib/community/models';
import { auth } from '../lib/firebase';

// Voting service
export const voteService = {
  async vote(userId: string, targetType: 'thread' | 'comment', targetId: string, value: 1 | -1, threadId?: string) {
    if (targetType === 'thread') {
      await firestoreVoteThread(targetId, userId, value);
    } else if (targetType === 'comment' && threadId) {
      await firestoreVoteComment(threadId, targetId, userId, value);
    } else {
      throw new Error('Invalid vote parameters');
    }
  },

  async getUserVotes(userId: string, targetType: 'thread' | 'comment', targetIds: string[], threadId?: string) {
    if (!userId || targetIds.length === 0) return {};
    
    if (targetType === 'thread' && targetIds.length === 1) {
      return firestoreGetUserVotes(userId, targetIds[0], targetIds, 'thread');
    } else if (targetType === 'comment' && threadId) {
      return firestoreGetUserVotes(userId, threadId, targetIds, 'comment');
    }
    
    return {};
  }
};

// Thread service
export const threadService = {
  async getThreads(
    sortBy: 'hot' | 'new' | 'top', 
    timeFilter?: 'today' | 'week' | 'month' | 'year' | 'all',
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    limitCount: number = 20
  ) {
    // For now, ignoring time filter as it would require additional indexes
    // In production, you'd create specific indexes for time-filtered queries
    return firestoreGetThreads(sortBy, lastDoc, limitCount);
  },

  async getThread(threadId: string) {
    return firestoreGetThread(threadId);
  },

  async createThread(
    title: string,
    bodyMarkdown: string,
    images: string[] = [],
    tags: string[] = [],
    breakdown?: { problemId: string; slideId: string; snapshotUrl?: string }
  ) {
    return firestoreCreateThread(title, bodyMarkdown, images, tags, breakdown);
  },

  async getBreakdownContext(threadId: string) {
    // Breakdown context is now embedded in the thread document
    const thread = await firestoreGetThread(threadId);
    return thread?.breakdown || null;
  }
};

// Comment service
export const commentService = {
  async getComments(threadId: string) {
    return firestoreGetComments(threadId);
  },

  async createComment(threadId: string, parentId: string | null, content: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required');
    
    return firestoreCreateComment(threadId, content, parentId || undefined);
  }
};

// Search service (client-side for now)
export const searchService = {
  async searchThreads(searchQuery: string, limitCount: number = 20) {
    // Get recent threads and filter client-side
    // In production, use Algolia or ElasticSearch
    const { threads } = await firestoreGetThreads('new', undefined, 100);

    const searchLower = searchQuery.toLowerCase();
    const filtered = threads.filter(thread => 
      thread.title.toLowerCase().includes(searchLower) ||
      thread.bodyMarkdown.toLowerCase().includes(searchLower)
    );

    return filtered.slice(0, limitCount);
  }
};