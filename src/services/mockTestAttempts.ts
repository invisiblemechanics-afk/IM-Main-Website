import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { firestore as db, auth } from '../lib/firebase';

export interface MockTestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  exam: string;
  startedAt: string;
  submittedAt: any; // Firestore timestamp
  isViolation?: boolean;
  totals: {
    correct: number;
    incorrect: number;
    unanswered: number;
    total: number;
    accuracy: number;
    score: number;
  };
  duration: number; // in minutes
  completedAt?: string; // human readable format
}

/**
 * Check if a user has already attempted a specific test
 */
export async function hasUserAttemptedTest(testId: string, userId?: string): Promise<boolean> {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return false;

    const attemptsRef = collection(db, 'users', uid, 'mockTestAttempts');
    const q = query(attemptsRef, where('testId', '==', testId));
    const snapshot = await getDocs(q);
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking user attempt:', error);
    return false;
  }
}

/**
 * Get user's attempt for a specific test (if exists)
 */
export async function getUserTestAttempt(testId: string, userId?: string): Promise<MockTestAttempt | null> {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return null;

    const attemptsRef = collection(db, 'users', uid, 'mockTestAttempts');
    const q = query(attemptsRef, where('testId', '==', testId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      completedAt: formatTimeAgo(data.submittedAt?.toDate() || new Date(data.startedAt))
    } as MockTestAttempt;
  } catch (error) {
    console.error('Error getting user test attempt:', error);
    return null;
  }
}

/**
 * Get recent attempts for a user
 */
export async function getRecentAttempts(userId?: string, limitCount: number = 10): Promise<MockTestAttempt[]> {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return [];

    const attemptsRef = collection(db, 'users', uid, 'mockTestAttempts');
    const q = query(
      attemptsRef, 
      orderBy('submittedAt', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    
    const attempts: MockTestAttempt[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      attempts.push({
        id: doc.id,
        ...data,
        completedAt: formatTimeAgo(data.submittedAt?.toDate() || new Date(data.startedAt))
      } as MockTestAttempt);
    });
    
    return attempts;
  } catch (error) {
    console.error('Error getting recent attempts:', error);
    return [];
  }
}

/**
 * Format time ago helper function
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format duration from seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes} min`;
  }
}
