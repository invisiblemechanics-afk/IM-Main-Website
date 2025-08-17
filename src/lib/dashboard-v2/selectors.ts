import { ActivityEvent, QuickStats, Streak, Trends, ContinueLearningItem, Playlist, VideoProgress, MockTestAttempt, DiagnosticResult } from './types';

export function toDate(x: any): Date | null {
  if (!x) return null;
  if (x instanceof Date) return x;
  if (typeof x === 'number') return new Date(x);
  if (typeof x === 'string') return new Date(x);
  if (x?.toDate) try { return x.toDate(); } catch { return null; }
  return null;
}

export function normalizePercent(x?: number | null): number | null {
  if (x == null) return null;
  // Handle 0..1 or 0..100
  if (x <= 1) return Math.round(x * 100);
  return Math.round(x);
}

export function computeStreak(events: ActivityEvent[], today = new Date()): Streak {
  // consider unique activity days across any event
  const days = new Set<string>();
  events.forEach(e => {
    const d = new Date(e.ts);
    const key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
    days.add(key);
  });

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  // current streak
  let curr = 0;
  const cursor = new Date(today);
  while (days.has(dayKey(cursor))) {
    curr++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // longest streak (scan back 365 days max)
  let longest = 0;
  let tmp = 0;
  const chk = new Date(today);
  for (let i = 0; i < 365; i++) {
    const key = dayKey(chk);
    if (days.has(key)) {
      tmp++;
      longest = Math.max(longest, tmp);
    } else {
      tmp = 0;
    }
    chk.setDate(chk.getDate() - 1);
  }
  return { current: curr, longest };
}

export function computeQuickStats(params: {
  playlists: Playlist[];
  videoProgress: VideoProgress[];
  mockAttempts: MockTestAttempt[];
  communityCounts: { threads: number; comments: number };
}): QuickStats {
  const topicsCompleted = params.videoProgress.filter(v => (v.progressPct ?? 0) >= 95).length;
  return {
    playlistsCount: params.playlists.length,
    topicsCompleted,
    mockAttempts: params.mockAttempts.length,
    communityContribs: (params.communityCounts?.threads ?? 0) + (params.communityCounts?.comments ?? 0),
  };
}

export function computeTrends(params: {
  diagnostics: DiagnosticResult[];
  mockAttempts: MockTestAttempt[];
  videoProgress: VideoProgress[];
}): Trends {
  const diag = params.diagnostics
    .sort((a,b) => (toDate(a.createdAt)?.getTime() ?? 0) - (toDate(b.createdAt)?.getTime() ?? 0))
    .slice(-10)
    .map(d => d.score ?? 0);

  const mocks = params.mockAttempts
    .sort((a,b) => (toDate(a.createdAt)?.getTime() ?? 0) - (toDate(b.createdAt)?.getTime() ?? 0))
    .slice(-10)
    .map(m => normalizePercent(m.accuracy ?? m.score ?? 0) ?? 0);

  // Use last 14 progress updates as a coarse completion trend
  const completion = params.videoProgress
    .sort((a,b) => (toDate(a.updatedAt)?.getTime() ?? 0) - (toDate(b.updatedAt)?.getTime() ?? 0))
    .slice(-14)
    .map(v => Math.round(v.progressPct ?? 0));

  return { diagnostics: diag, mocks, completion };
}

export function deriveContinueLearning(params: {
  lastVideo?: VideoProgress | null;
  lastPlaylist?: Playlist | null;
}): ContinueLearningItem | null {
  if (params.lastVideo) {
    return {
      label: params.lastVideo.title || 'Resume last video',
      progressPct: Math.round(params.lastVideo.progressPct ?? 0),
      href: `/learning/video/${params.lastVideo.videoId ?? params.lastVideo.topicId}`,
    };
  }
  if (params.lastPlaylist) {
    const pct = Math.round(((params.lastPlaylist.completedItems ?? 0) / Math.max(1,(params.lastPlaylist.totalItems ?? 1))) * 100);
    return {
      label: `Continue: ${params.lastPlaylist.name}`,
      progressPct: pct,
      href: `/learning/playlists/${params.lastPlaylist.id}`,
    };
  }
  return null;
}



