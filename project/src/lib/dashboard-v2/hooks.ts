'use client';

import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, getDoc, limit, orderBy, query, where } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adapted to actual path
import { toDate, computeStreak, computeTrends, computeQuickStats, deriveContinueLearning } from './selectors';
import { ActivityEvent, DiagnosticResult, MockTestAttempt, Playlist, UserProfile, VideoProgress, UserAnswer } from './types';

function safeGet<T>(snap: any): T | null {
  if (!snap?.exists?.()) return null;
  return { id: snap.id, ...snap.data?.() } as T;
}

export async function useDashboardV2Data(): Promise<{
  user: UserProfile | null;
  streak: { current: number; longest: number };
  trends: ReturnType<typeof computeTrends>;
  quickStats: ReturnType<typeof computeQuickStats>;
  continueItem: ReturnType<typeof deriveContinueLearning>;
  examDate: Date | null;
}> {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) return {
    user: null,
    streak: { current: 0, longest: 0 },
    trends: { diagnostics: [], mocks: [], completion: [] },
    quickStats: { playlistsCount: 0, topicsCompleted: 0, mockAttempts: 0, communityContribs: 0 },
    continueItem: null,
    examDate: null,
  };

  // --- Locate real collection names by searching the codebase:
  // users/{uid} profile
  const userDoc = await getDoc(doc(firestore, 'users', uid));
  const user = (userDoc.exists() ? { uid, ...userDoc.data() } : { uid }) as UserProfile;

  // playlists owned by user (based on existing Dashboard.tsx pattern)
  let playlists: Playlist[] = [];
  try {
    const userPlaylistsRef = collection(doc(firestore, 'users', uid), 'playlists');
    const playlistsQuery = query(userPlaylistsRef, orderBy('createdAt', 'desc'), limit(50));
    const playlistsSnap = await getDocs(playlistsQuery);
    playlists = playlistsSnap.docs.map(d => ({ 
      id: d.id, 
      ownerId: uid,
      name: d.data().name,
      description: d.data().description,
      topicTags: d.data().topicTags || [],
      createdAt: d.data().createdAt,
      totalItems: d.data().topicTags?.length || 0,
      completedItems: 0, // TODO: Calculate from actual progress
      lastAccessedAt: d.data().createdAt
    }));
  } catch (e) {
    console.warn('Failed to fetch playlists:', e);
  }

  // video progress (simulate based on typical patterns)
  let videoProgress: VideoProgress[] = [];
  // Note: This project doesn't seem to track video progress explicitly,
  // so we'll create empty state for graceful handling

  // user answers (from breakdowns)
  let userAnswers: UserAnswer[] = [];
  try {
    const qUA = query(collection(firestore, 'userAnswers'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(100));
    const snapUA = await getDocs(qUA);
    userAnswers = snapUA.docs.map(d => ({
      userId: uid,
      questionId: d.id,
      breakdownId: d.data().breakdownId,
      isCorrect: d.data().isCorrect,
      createdAt: d.data().createdAt,
      ...d.data()
    }));
  } catch (e) {
    console.warn('Failed to fetch user answers:', e);
  }

  // mock test attempts
  let mockAttempts: MockTestAttempt[] = [];
  try {
    const qM = query(collection(firestore, 'users', uid, 'mockTestAttempts'), orderBy('createdAt', 'desc'), limit(20));
    const snapM = await getDocs(qM);
    mockAttempts = snapM.docs.map(d => ({ 
      id: d.id, 
      userId: uid,
      testId: d.data().testId || d.id,
      score: d.data().score,
      accuracy: d.data().accuracy,
      durationSec: d.data().durationSec,
      createdAt: d.data().createdAt,
      subjectBreakup: d.data().subjectBreakup,
      ...d.data()
    }));
  } catch (e) {
    console.warn('Failed to fetch mock test attempts:', e);
  }

  // diagnostics results
  let diagnostics: DiagnosticResult[] = [];
  try {
    const qD = query(collection(firestore, 'users', uid, 'diagnostics'), orderBy('createdAt', 'desc'), limit(20));
    const snapD = await getDocs(qD);
    diagnostics = snapD.docs.map(d => ({ 
      id: d.id, 
      userId: uid,
      score: d.data().score,
      createdAt: d.data().createdAt,
      subjectBreakup: d.data().subjectBreakup,
      ...d.data()
    }));
  } catch (e) {
    // fallback to a top-level collection if that's how your codebase stores it
    try {
      const qD2 = query(collection(firestore, 'diagnosticResults'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20));
      const snapD2 = await getDocs(qD2);
      diagnostics = snapD2.docs.map(d => ({ 
        id: d.id, 
        userId: uid,
        score: d.data().score,
        createdAt: d.data().createdAt,
        subjectBreakup: d.data().subjectBreakup,
        ...d.data()
      }));
    } catch (e2) {
      console.warn('Failed to fetch diagnostic results:', e2);
    }
  }

  // community counts (soft, cheap estimate)
  let threads = 0, comments = 0;
  try {
    const qT = query(collection(firestore, 'threads'), where('userId', '==', uid), limit(1));
    const snapT = await getDocs(qT);
    threads = snapT.size; // NOTE: cheap proxy; for exact count, use aggregated field if present
  } catch (e) {
    console.warn('Failed to fetch thread count:', e);
  }
  try {
    const qC = query(collection(firestore, 'comments'), where('userId', '==', uid), limit(1));
    const snapC = await getDocs(qC);
    comments = snapC.size;
  } catch (e) {
    console.warn('Failed to fetch comment count:', e);
  }

  // build events for streak (union of latest from each source)
  const events: ActivityEvent[] = [];
  videoProgress.slice(0, 50).forEach(v => { const d = toDate(v.updatedAt); if (d) events.push({ ts: d, kind: 'video' }); });
  userAnswers.slice(0, 100).forEach(a => { const d = toDate(a.createdAt); if (d) events.push({ ts: d, kind: 'answer' }); });
  mockAttempts.slice(0, 20).forEach(m => { const d = toDate(m.createdAt); if (d) events.push({ ts: d, kind: 'mock' }); });
  diagnostics.slice(0, 20).forEach(di => { const d = toDate(di.createdAt); if (d) events.push({ ts: d, kind: 'diagnostic' }); });
  playlists.forEach(p => { const d = toDate(p.lastAccessedAt || p.createdAt); if (d) events.push({ ts: d, kind: 'playlist' }); });

  const streak = computeStreak(events);

  // trends + quick stats
  const trends = computeTrends({ diagnostics, mockAttempts, videoProgress });
  const quickStats = computeQuickStats({
    playlists,
    videoProgress,
    mockAttempts,
    communityCounts: { threads, comments }
  });

  // continue learning (prefer last video progress)
  const lastVideo = videoProgress.sort((a,b) => (toDate(b.updatedAt)?.getTime() ?? 0) - (toDate(a.updatedAt)?.getTime() ?? 0))[0] ?? null;
  const lastPlaylist = playlists.sort((a,b) => (toDate(b.lastAccessedAt || b.createdAt)?.getTime() ?? 0) - (toDate(a.lastAccessedAt || a.createdAt)?.getTime() ?? 0))[0] ?? null;
  const continueItem = deriveContinueLearning({ lastVideo, lastPlaylist });

  // exam date
  let examDate: Date | null = null;
  if (user?.examDate) {
    const d = new Date(user.examDate);
    if (!isNaN(d.getTime())) examDate = d;
  } else if (user?.attemptYear) {
    // Fallback: April 1st of attemptYear (adjust later if you store an exact date)
    const d = new Date(user.attemptYear, 3, 1);
    examDate = d;
  }

  return { user, streak, trends, quickStats, continueItem, examDate };
}



