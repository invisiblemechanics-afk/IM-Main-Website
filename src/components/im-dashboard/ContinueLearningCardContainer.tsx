'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, where
} from 'firebase/firestore';
import ContinueLearningCard, { ContinueCandidate } from './ContinueLearningCard';
// Import the existing Firebase client
import { firestore } from '../../lib/firebase';

function toDate(x: any): Date | null {
  if (!x) return null;
  if (x instanceof Date) return x;
  if (typeof x === 'number') return new Date(x);
  if (typeof x === 'string') return new Date(x);
  if (x?.toDate) { try { return x.toDate(); } catch {} }
  return null;
}
const pct = (a?: number, b?: number) => (!a || !b || b <= 0) ? null : Math.round((a/b)*100);
const pickMostRecent = <T extends { updatedAt?: Date | null }>(arr: T[]) =>
  arr.sort((a,b)=>(b.updatedAt?.getTime() ?? 0)-(a.updatedAt?.getTime() ?? 0))[0];

export default function ContinueLearningCardContainer() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ContinueCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const uid = getAuth().currentUser?.uid;
        if (!uid) { if (mounted) { setCandidates([]); setLoading(false); } return; }

        const results: ContinueCandidate[] = [];

        // --- VIDEO: prefer updatedAt desc, fallback to unordered sample
        try {
          let d = (await getDocs(query(
            collection(firestore, 'users', uid, 'videoProgress'),
            orderBy('updatedAt', 'desc'),
            limit(3)
          ))).docs.map(x => x.data() as any);

          if (d.length === 0) {
            // fallback, unordered small batch
            d = (await getDocs(query(collection(firestore, 'users', uid, 'videoProgress'), limit(3))))
                  .docs.map(x => x.data() as any);
          }

          if (d.length > 0) {
            const mapped = d.map(v => {
              const updatedAt = toDate(v.updatedAt) ?? toDate(v.createdAt) ?? null;
              const progressPct =
                typeof v.progressPct === 'number'
                  ? (v.progressPct <= 1 ? Math.round(v.progressPct * 100) : Math.round(v.progressPct))
                  : pct(v.positionSec, v.durationSec);

              const href = `/learning/video/${v.videoId ?? v.topicId}${v.positionSec ? `?t=${Math.floor(v.positionSec)}` : ''}`;
              return {
                kind: 'video' as const,
                label: v.title || 'Resume last video',
                href,
                progressPct: progressPct ?? null,
                updatedAt,
              };
            });
            const best = pickMostRecent(mapped);
            if (best) results.push(best);
          }
        } catch {}

        // --- PRACTICE: in_progress by updatedAt desc; fallback to any session
        try {
          let snap = await getDocs(query(
            collection(firestore, 'users', uid, 'practiceSessions'),
            where('status', '==', 'in_progress'),
            orderBy('updatedAt', 'desc'),
            limit(3)
          ));
          if (snap.empty) {
            snap = await getDocs(query(collection(firestore, 'users', uid, 'practiceSessions'), limit(3)));
          }
          const doc0 = snap.docs[0];
          if (doc0) {
            const p = doc0.data() as any;
            const updatedAt = toDate(p.updatedAt) ?? toDate(p.createdAt) ?? null;
            const progressPct = (typeof p.totalCount === 'number' && p.totalCount > 0)
              ? pct(p.answeredCount ?? 0, p.totalCount)
              : null;

            const sessionId = doc0.id;
            const topic = p.topicId || sessionId;
            const href = `/practice/${topic}?resume=1&session=${sessionId}`;

            results.push({
              kind: 'practice',
              label: `Continue practice: ${p.topicName ?? topic}`,
              href,
              progressPct,
              updatedAt,
            });
          }
        } catch {}

        // --- BREAKDOWN: from userAnswers (top-level) with breakdownId; fallback to nested
        async function fetchBreakdownCandidate(fromNested: boolean) {
          const base = fromNested
            ? collection(firestore, 'users', uid, 'userAnswers')
            : collection(firestore, 'userAnswers');

          const sUa = await getDocs(query(
            base,
            where('userId', '==', uid),
            orderBy('updatedAt', 'desc'),
            limit(50)
          ));

          let chosen: any | null = null;
          for (const docUa of sUa.docs) {
            const ua = docUa.data() as any;
            if (ua.breakdownId) { chosen = ua; break; }
          }
          if (!chosen) return;

          const updatedAt = toDate(chosen.updatedAt) ?? toDate(chosen.createdAt) ?? null;
          const breakdownId: string = chosen.breakdownId;
          const answeredCount = chosen.answers ? Object.keys(chosen.answers).length : 0;

          let title: string | null = null;
          let progressPct: number | null = null;
          try {
            const bDoc = await getDoc(doc(firestore, 'breakdowns', breakdownId));
            if (bDoc.exists()) {
              const bd = bDoc.data() as any;
              title = bd.title || null;
              if (typeof bd.slideCount === 'number' && bd.slideCount > 0) {
                progressPct = pct(answeredCount, bd.slideCount);
              }
            }
          } catch {}

          const nextStepIndex = answeredCount; // best-effort
          const href = `/breakdowns/${breakdownId}?step=${nextStepIndex}`;

          results.push({
            kind: 'breakdown',
            label: `Resume breakdown: ${title ?? breakdownId}`,
            href,
            progressPct,
            updatedAt,
          });
        }

        try { await fetchBreakdownCandidate(false); } catch {}
        if (!results.find(r => r.kind === 'breakdown')) {
          try { await fetchBreakdownCandidate(true); } catch {}
        }

        // Dedup by kind and sort by recency
        const dedup = new Map<ContinueCandidate['kind'], ContinueCandidate>();
        for (const r of results) {
          const prev = dedup.get(r.kind);
          if (!prev || (r.updatedAt?.getTime() ?? 0) > (prev.updatedAt?.getTime() ?? 0)) {
            dedup.set(r.kind, r);
          }
        }
        const finalList = Array.from(dedup.values()).sort(
          (a,b)=>(b.updatedAt?.getTime() ?? 0)-(a.updatedAt?.getTime() ?? 0)
        );

        if (mounted) {
          setCandidates(finalList);
          setSelectedIndex(0);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setCandidates([]);
          setSelectedIndex(0);
          setLoading(false);
        }
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <ContinueLearningCard
      loading={loading}
      candidates={candidates}
      selectedIndex={selectedIndex}
      onSelect={setSelectedIndex}
    />
  );
}
