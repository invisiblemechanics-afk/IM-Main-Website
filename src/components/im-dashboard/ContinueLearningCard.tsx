'use client';
import { Link } from 'react-router-dom';
import React from 'react';

export type ContinueCandidate = {
  kind: 'video' | 'breakdown' | 'practice';
  label: string;
  href: string;
  progressPct?: number | null;
  updatedAt?: Date | null;
};

type Props = {
  loading?: boolean;
  candidates: ContinueCandidate[];
  selectedIndex: number;
  onSelect: (idx: number) => void;
};

const kindLabel: Record<ContinueCandidate['kind'], string> = {
  video: 'Video',
  breakdown: 'Breakdown',
  practice: 'Practice',
};

export default function ContinueLearningCard({
  loading,
  candidates,
  selectedIndex,
  onSelect,
}: Props) {
  const selected = candidates[selectedIndex];

  return (
    <div
      className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur
                 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500">
            Continue learning
          </div>

          {/* Title */}
          {loading ? (
            <div className="mt-2 h-6 w-64 rounded bg-black/10 animate-pulse" />
          ) : (
            <div className="mt-1 text-xl text-zinc-900 truncate">
              {selected?.label ?? 'Start your first lesson'}
            </div>
          )}

          {/* Progress bar (only if known) */}
          {!loading && selected?.progressPct != null && (
            <div className="mt-3 w-56 h-2 bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-black/80 transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, Math.round(selected.progressPct)))}%`,
                }}
              />
            </div>
          )}

          {/* Pills: only when useful (≥2 candidates) */}
          {!loading && candidates.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {candidates.map((c, i) => (
                <button
                  key={`${c.kind}-${i}`}
                  onClick={() => onSelect(i)}
                  className={[
                    'px-3 py-1 rounded-lg border text-sm transition',
                    i === selectedIndex
                      ? 'border-black/25 bg-black/5 text-zinc-900'
                      : 'border-black/10 bg-white/60 text-zinc-600 hover:bg-white/80',
                  ].join(' ')}
                  aria-pressed={i === selectedIndex}
                >
                  {kindLabel[c.kind]}
                </button>
              ))}
            </div>
          )}

          {/* Empty/help text */}
          {!loading && !selected && (
            <p className="mt-2 text-sm text-zinc-600">
              New here? Take a quick diagnostic to get your starting playlist.
            </p>
          )}
        </div>

        {/* Primary CTA */}
        <Link
          to={selected?.href ?? '/learning'}
          className="shrink-0 rounded-xl px-4 py-2 bg-black text-white text-sm hover:opacity-90 transition"
        >
          {selected ? 'Resume' : 'Explore'}
        </Link>
      </div>
    </div>
  );
}
