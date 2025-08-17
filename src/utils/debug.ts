// src/utils/debug.ts
export const DEBUG_SLIDES = import.meta.env.DEV && (window as any).__IM_DEBUG_SLIDES__ === true;

export function logSlideCheck(s: any) {
  if (!DEBUG_SLIDES) return;
  const nq = s?.normalizedQuestion;
  if (nq?.type === 'MCQ' && Number.isFinite(nq.correctIndex)) {
    console.debug('[SlideCheck] MCQ correctIndex:', nq.correctIndex, 'choices:', nq.choices?.length);
  }
}
