'use client';
import { Link } from 'react-router-dom';
import React, { useMemo, useState } from 'react';

type Candidate = {
  kind: 'video' | 'breakdown' | 'practice';
  label: string;
  href: string;
  progressPct?: number | null;
  positionSec?: number;
  durationSec?: number;
  answeredCount?: number;
  totalCount?: number;
  updatedAt?: Date;
};

const DATA: Candidate[] = [
  { kind: 'video',     label: 'Resume: Kinematics – Relative Motion', href: '/learning/video/kinematics?t=420', progressPct: 23, positionSec: 420, durationSec: 1800, updatedAt: new Date(Date.now()-60*1000) },
  { kind: 'breakdown', label: 'Resume breakdown: Work–Energy Theorem', href: '/breakdowns/bd_work_energy?step=4', progressPct: 40, answeredCount: 4, totalCount: 10, updatedAt: new Date(Date.now()-10*60*1000) },
  { kind: 'practice',  label: 'Continue practice: Projectile Motion',  href: '/practice/mech-projectile?resume=1&session=sd', progressPct: 30, answeredCount: 12, totalCount: 40, updatedAt: new Date(Date.now()-30*60*1000) },
];

const kindText: Record<Candidate['kind'], string> = { video: 'Video', breakdown: 'Breakdowns', practice: 'Practice' };
const clampPct = (x?: number | null) => Math.min(100, Math.max(0, Math.round(x ?? 0)));
const minsLeft = (pos?: number, dur?: number) => (!pos || !dur || dur <= pos) ? null : Math.round((dur - pos) / 60);
const timeAgo = (d?: Date) => { if(!d) return '—'; const s = Math.floor((Date.now()-d.getTime())/1000); if(s<60) return `${s}s ago`; const m=Math.floor(s/60); if(m<60) return `${m}m ago`; const h=Math.floor(m/60); return h<24?`${h}h ago`:`${Math.floor(h/24)}d ago`; };
const ctaFromPct = (p?: number | null) => (p ?? 0) >= 100 ? 'Review' : (p ?? 0) >= 95 ? 'Finish' : 'Resume';

export default function ContinueLearningCardStatic() {
  const candidates = useMemo(() => [...DATA].sort((a,b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)), []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = candidates[selectedIndex];

  // Context line under title
  const context = useMemo(() => {
    if (!selected) return '';
    if (selected.kind === 'video') {
      const m = minsLeft(selected.positionSec, selected.durationSec);
      return m != null ? `${m}m left` : '';
    }
    if (selected.kind === 'breakdown') {
      const a = selected.answeredCount ?? 0, t = selected.totalCount ?? 0;
      return t > 0 ? `Step ${Math.min(a+1, t)}/${t}` : '';
    }
    if (selected.kind === 'practice') {
      const a = selected.answeredCount ?? 0, t = selected.totalCount ?? 0;
      return t > 0 ? `Q${Math.min(a+1, t)}/${t}` : `Q${a+1}`;
    }
    return '';
  }, [selected]);

  // Compact footer summary
  const video = candidates.find(c => c.kind === 'video');
  const breakdown = candidates.find(c => c.kind === 'breakdown');
  const practice = candidates.find(c => c.kind === 'practice');
  const summaryBits: string[] = [];
  if (video) {
    const m = minsLeft(video.positionSec, video.durationSec);
    summaryBits.push(`Video ${clampPct(video.progressPct)}%${m!=null?` • ${m}m left`:''}`);
  }
  if (breakdown) {
    const a = breakdown.answeredCount ?? 0, t = breakdown.totalCount ?? 0;
    summaryBits.push(`Breakdowns ${t>0?`${a}/${t}`:`${clampPct(breakdown.progressPct)}%`}`);
  }
  if (practice) {
    const a = practice.answeredCount ?? 0, t = practice.totalCount ?? 0;
    summaryBits.push(`Practice ${t>0?`${a}/${t}`:`${clampPct(practice.progressPct)}%`}`);
  }

  const ctaLabel = ctaFromPct(selected?.progressPct);
  const lastActive = timeAgo(selected?.updatedAt);

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500">Continue learning</div>
          <div className="mt-0.5 text-lg text-zinc-900 truncate">{selected?.label ?? 'Start your first lesson'}</div>
          {context && <div className="mt-0.5 text-sm text-zinc-600">{context}</div>}

          {/* Single progress bar */}
          {selected?.progressPct != null && (
            <div className="mt-2 w-56 h-2 bg-black/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={selected.progressPct ?? undefined} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-black/80 transition-all" style={{ width: `${clampPct(selected.progressPct)}%` }} />
            </div>
          )}

          {/* Pills (only if >1) + last active */}
          {candidates.length > 1 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="flex flex-wrap gap-2">
                {candidates.map((c, i) => (
                  <button
                    key={`${c.kind}-${i}`}
                    onClick={() => setSelectedIndex(i)}
                    className={[
                      'px-2.5 py-1 rounded-lg border text-xs transition',
                      i === selectedIndex
                        ? 'border-black/25 bg-black/5 text-zinc-900'
                        : 'border-black/10 bg-white/60 text-zinc-600 hover:bg-white/80',
                    ].join(' ')}
                    aria-pressed={i === selectedIndex}
                  >
                    {kindText[c.kind]}
                  </button>
                ))}
              </div>
              <span className="text-xs text-zinc-500">Last active {lastActive}</span>
            </div>
          )}

          {/* Compact footer summary */}
          <div className="mt-3 text-xs text-zinc-600">
            {summaryBits.join('   •   ')}
          </div>
        </div>

        <Link
          to={selected?.href ?? '/learning'}
          aria-label={`${ctaLabel} ${selected?.label ?? ''}`}
          className="shrink-0 rounded-xl px-4 py-2 bg-black text-white text-sm hover:opacity-90 transition"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}