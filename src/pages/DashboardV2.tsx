'use client';

import { useEffect, useState } from 'react';
import ContinueLearningCard from '../components/dashboard-v2/ContinueLearningCard';
import GoalsStreakTile from '../components/dashboard-v2/GoalsStreakTile';
import PerformanceSnapshot from '../components/dashboard-v2/PerformanceSnapshot';
import QuickStatsChips from '../components/dashboard-v2/QuickStatsChips';
import ExamCountdownQuickAction from '../components/dashboard-v2/ExamCountdownQuickAction';
import { useDashboardV2Data } from '../lib/dashboard-v2/hooks';

export default function DashboardV2Page() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof useDashboardV2Data>> | null>(null);

  useEffect(() => {
    document.title = 'Dashboard V2 - Invisible Mechanics';
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const d = await useDashboardV2Data();
      if (mounted) {
        setData(d);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-black p-6 space-y-4">
        <div className="h-24 rounded-2xl bg-zinc-900/50 border border-white/10 animate-pulse"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-40 rounded-2xl bg-zinc-900/50 border border-white/10 animate-pulse"/>
          <div className="h-40 rounded-2xl bg-zinc-900/50 border border-white/10 animate-pulse"/>
          <div className="h-40 rounded-2xl bg-zinc-900/50 border border-white/10 animate-pulse"/>
        </div>
      </div>
    );
  }

  // simple idle heuristic: days since most recent activity event used in streak
  const allDates: Date[] = [];
  // We don't expose events directly; recompute a rough idle estimate from the data we have
  const pull = (v: any) => v && (v.updatedAt || v.createdAt);
  // NOTE: This is best-effort; it remains read-only
  (data as any)?.trends && [
    // no exact timestamps here; idleDays is only used to switch CTA
  ];
  const idleDays = 0; // keep CTA stable; if you want, wire a precise idle calc using events inside the hook

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-6 space-y-5 max-w-6xl mx-auto">
        {/* 5 modules only */}
        <ExamCountdownQuickAction examDate={data.examDate} idleDays={idleDays} />

        <ContinueLearningCard item={data.continueItem} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GoalsStreakTile streak={data.streak} todayTasks={[
            '1 breakdown',
            '1 mock',
            '25 mins video'
          ]} />
          <PerformanceSnapshot trends={data.trends} />
        </div>

        <QuickStatsChips stats={data.quickStats} />
      </div>
    </div>
  );
}



