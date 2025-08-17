'use client';
import { Link } from 'react-router-dom';
import React from 'react';

export default function ContinueLearningCard({ item }: { item: { label: string; progressPct?: number; href: string } | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-zinc-400">Continue Learning</div>
        <div className="mt-1 text-xl text-white">{item?.label ?? 'Start your first lesson'}</div>
        {item?.progressPct != null && (
          <div className="mt-3 w-56 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/80" style={{ width: `${Math.min(100, Math.max(0, item.progressPct))}%` }}/>
          </div>
        )}
      </div>
      <Link to={item?.href ?? '/breakdowns'} className="rounded-xl px-4 py-2 bg-white text-black text-sm hover:opacity-90 transition">
        {item ? 'Resume' : 'Explore'}
      </Link>
    </div>
  );
}



