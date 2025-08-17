// src/components/breakdowns/hooks/useSlidesOrdered.ts
import { useEffect, useMemo, useState } from 'react';
import {
  onSnapshot, query, orderBy, DocumentData, QueryDocumentSnapshot, getDocs
} from 'firebase/firestore';
import { slidesCol } from '@/lib/paths';
import type { Slide, TheorySlide, MCQSlide, NumericSlide } from '../types';
import { normalizeSlideQuestion } from '@/utils/normalizeSlideQuestion';

function mapDoc(d: QueryDocumentSnapshot<DocumentData>): Slide {
  const data = d.data();
  
  const rawKind = typeof data.kind === 'string' ? data.kind.toLowerCase() : '';
  const rawType = typeof data.type === 'string' ? data.type.toLowerCase() : '';

  // Normalize commonly used fields
  const title = data.title || data.questionText || 'Untitled Slide';
  const html = data.html || data.content || data.text || data.questionText || '';
  const img = data.img || data.imagePath || data.imageURL || data.imageUrl || undefined;

  // 1) Explicit theory
  if (rawKind === 'theory' || rawType === 'theory') {
    return {
      id: data.id || d.id,
      type: 'theory',
      title,
      html,
      img,
      order: data.order,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  // 2) Question kind
  if (rawKind === 'question') {
    const questionText = data.questionText || data.question || '';
    const typeLabel = (data.type || data.questionType || '').toString().toLowerCase();
    const isNumeric = typeLabel.includes('numerical') || typeLabel.includes('numeric') || rawType === 'numerical' || rawType === 'numeric';

    if (isNumeric) {
      const numericSlideData = {
        id: data.id || d.id,
        type: 'numeric',
        title,
        question: questionText,
        answer: data.answer ?? data.answerIndex ?? 0,
        rangeMin: (data.range && (data.range.min ?? data.rangeMin ?? data.min)) ?? undefined,
        rangeMax: (data.range && (data.range.max ?? data.rangeMax ?? data.max)) ?? undefined,
        hint: data.hint || undefined,
        img,
        order: data.order,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      // Add normalized question data for numerical slides
      (numericSlideData as any).normalizedQuestion = normalizeSlideQuestion({
        type: 'Numerical',
        choices: [],
        range: data.range ? { 
          min: Number(data.range.min), 
          max: Number(data.range.max) 
        } : undefined,
      });

      return numericSlideData;
    }

    // Determine MCQ single vs multi
    const indicatesMulti = typeLabel.includes('multiple answer') || typeLabel.includes('multi');
    const indicatesSingle = typeLabel.includes('single');
    
    // Get choices/options
    const rawChoices = data.choices || data.options || [];
    const choices = Array.isArray(rawChoices) ? rawChoices : [];
    
    // Get correct answers
    let correct: number[] = [];
    if (Array.isArray(data.answerIndices)) {
      correct = data.answerIndices.map((v: any) => Number(v));
    } else if (Array.isArray(data.correct)) {
      correct = data.correct.map((v: any) => Number(v));
    } else if (typeof data.answerIndex === 'number') {
      correct = [data.answerIndex];
    } else if (typeof data.answer === 'number') {
      correct = [data.answer];
    }

    const slideData = {
      id: data.id || d.id,
      type: indicatesMulti ? 'mcq-multi' : 'mcq-single',
      title,
      question: questionText,
      options: choices,
      correct,
      hint: data.hint || undefined,
      img,
      order: data.order,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    // Add normalized question data for breakdowns
    (slideData as any).normalizedQuestion = normalizeSlideQuestion(data);

    return slideData;
  }

  // Fallback - treat as theory
  return {
    id: data.id || d.id,
    type: 'theory',
    title,
    html,
    img,
    order: data.order,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function cmpNullableNumber(a?: number, b?: number) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;   // push undefined to the end
  if (b == null) return -1;
  return a - b;
}

export function useSlidesOrdered(chapterId: string, breakdownId: string) {
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!chapterId || !breakdownId) {
      setSlides([]);
      setError(null);
      return;
    }

    console.log(`🔍 Loading slides for chapter: ${chapterId}, breakdown: ${breakdownId}`);

    // Try the ordered query first, fallback to simple query if index doesn't exist
    const tryOrderedQuery = () => {
      try {
        const q = query(
          slidesCol(chapterId, breakdownId),
          orderBy('order', 'asc'),
          orderBy('createdAt', 'asc')
        );

        return onSnapshot(
          q,
          (snap) => {
            console.log(`✅ Ordered query succeeded, found ${snap.docs.length} slides`);
            const rows = snap.docs.map(mapDoc);

            // Extra safety: if some legacy docs still lack `order`, apply a stable client sort
            const needsFallback = rows.some(r => r.order == null);
            const sorted = needsFallback
              ? [...rows].sort((a, b) =>
                  cmpNullableNumber(a.order, b.order) ||
                  ((a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
                )
              : rows;

            setSlides(sorted);
            setError(null);
          },
          (err) => {
            console.warn('❌ Ordered query failed, trying fallback:', err.message);
            // If the ordered query fails (likely due to missing index), try a simple query
            trySimpleQuery();
          }
        );
      } catch (err) {
        console.warn('❌ Failed to create ordered query, trying fallback:', err);
        return trySimpleQuery();
      }
    };

    const trySimpleQuery = () => {
      // Fallback: get all slides without ordering, then sort client-side
      return onSnapshot(
        slidesCol(chapterId, breakdownId),
        (snap) => {
          console.log(`✅ Simple query succeeded, found ${snap.docs.length} slides`);
          const rows = snap.docs.map(mapDoc);

          // Client-side sort by order field, then by createdAt
          const sorted = [...rows].sort((a, b) =>
            cmpNullableNumber(a.order, b.order) ||
            ((a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
          );

          setSlides(sorted);
          setError(null);
        },
        (err) => {
          console.error('❌ Both queries failed:', err);
          setError(err as Error);
        }
      );
    };

    // Start with the simple query for now (composite index may not exist yet)
    // Can be changed to tryOrderedQuery() once the Firestore index is created
    const unsub = trySimpleQuery();

    return () => unsub();
  }, [chapterId, breakdownId]);

  const ready = useMemo(() => Array.isArray(slides), [slides]);

  return { slides: slides ?? [], ready, error };
}
