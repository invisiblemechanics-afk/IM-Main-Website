// Lightweight evaluation utilities for mock tests

export type QuestionType = 'MCQ' | 'MultipleAnswer' | 'Numerical';
export type ResultKind = 'correct' | 'incorrect' | 'partial' | 'unattempted';

export interface TestQuestion {
  id: string;
  type: QuestionType;
  // answers
  answerIndex?: number; // MCQ
  answerIndices?: number[]; // MultipleAnswer
  range?: { min: number; max: number }; // Numerical (inclusive)

  // meta
  marksCorrect?: number;
  marksWrong?: number;
  difficultyBand?: 'easy' | 'moderate' | 'tough' | string;
  chapter?: string;
  chapterId?: string;
  skillTags?: string[];
  partialCorrect?: boolean; // MultipleAnswer only (legacy)
  partialScheme?: { mode?: string }; // New partial scoring structure
  perOptionMarks?: number; // Marks per correct option in partial scoring
}

export type UserResponse =
  | { kind: 'MCQ'; choiceIndex?: number }
  | { kind: 'MultipleAnswer'; choiceIndices?: number[] }
  | { kind: 'Numerical'; value?: number | string };

export interface PerQuestionEval {
  qid: string;
  result: ResultKind;
  score: number;
  timeSec: number;
  // UI helpers
  difficulty: string;
  type: QuestionType;
  chapter?: string;
  chapterId?: string;
  skillTags?: string[];
}

function getMarks(
  q: TestQuestion,
  testDefaults?: { marksCorrect?: number; marksWrong?: number }
) {
  const marksCorrect =
    q.marksCorrect ?? testDefaults?.marksCorrect ?? 4;
  const marksWrong = q.marksWrong ?? testDefaults?.marksWrong ?? -1;
  return { marksCorrect, marksWrong };
}

export function isUnattempted(resp?: UserResponse): boolean {
  if (!resp) return true;
  if (resp.kind === 'MCQ') return resp.choiceIndex === undefined;
  if (resp.kind === 'MultipleAnswer') return !resp.choiceIndices || resp.choiceIndices.length === 0;
  if (resp.kind === 'Numerical')
    return resp.value === undefined || resp.value === '' || Number.isNaN(Number(resp.value));
  return true;
}

export function evalMCQ(
  q: TestQuestion,
  resp: UserResponse | undefined,
  testDefaults?: { marksCorrect?: number; marksWrong?: number }
) {
  const { marksCorrect, marksWrong } = getMarks(q, testDefaults);
  if (isUnattempted(resp)) return { result: 'unattempted' as ResultKind, score: 0 };
  const isCorrect = q.answerIndex === (resp as any).choiceIndex;
  return { result: (isCorrect ? 'correct' : 'incorrect') as ResultKind, score: isCorrect ? marksCorrect : marksWrong };
}

export function evalMultiple(
  q: TestQuestion,
  resp: UserResponse | undefined,
  testDefaults?: { marksCorrect?: number; marksWrong?: number }
) {
  const { marksCorrect, marksWrong } = getMarks(q, testDefaults);
  if (isUnattempted(resp)) return { result: 'unattempted' as ResultKind, score: 0 };
  const correct = new Set(q.answerIndices ?? []);
  const chosen = new Set((resp as any).choiceIndices ?? []);
  let wrongChosen = 0,
    correctChosen = 0;
  chosen.forEach((i) => {
    if (correct.has(i)) correctChosen++;
    else wrongChosen++;
  });

  // Check if partial scoring is enabled (check both old and new formats)
  const hasPartialScoring = q.partialCorrect || (q.partialScheme?.mode === 'perOption');
  const perOptionMarks = q.perOptionMarks || 1; // Default to 1 mark per option

  console.log('🔍 MultipleAnswer Evaluation Debug:', {
    questionId: q.id,
    partialCorrect: q.partialCorrect,
    partialScheme: q.partialScheme,
    perOptionMarks: q.perOptionMarks,
    hasPartialScoring,
    correctAnswers: Array.from(correct),
    userChoices: Array.from(chosen),
    correctChosen,
    wrongChosen,
    marksCorrect,
    marksWrong
  });

  if (!hasPartialScoring) {
    console.log('📊 Using all-or-nothing scoring (no partial scoring enabled)');
    const exact = wrongChosen === 0 && correctChosen === correct.size && chosen.size === correct.size;
    return { result: (exact ? 'correct' : 'incorrect') as ResultKind, score: exact ? marksCorrect : marksWrong };
  }

  console.log('📊 Using partial scoring - perOption mode');
  
  // For partial scoring: use perOptionMarks for each correct option selected
  let score = correctChosen * perOptionMarks; // e.g., 2 correct × 1 mark = +2
  
  // Apply negative marking for wrong choices if configured
  if (wrongChosen > 0 && marksWrong < 0) {
    // Use the marksWrong value per wrong choice
    score += wrongChosen * marksWrong;
  }
  
  console.log('📊 Partial scoring calculation:', {
    correctChosen,
    perOptionMarks,
    baseScore: correctChosen * perOptionMarks,
    wrongChosen,
    marksWrong,
    negativeMarks: wrongChosen > 0 && marksWrong < 0 ? wrongChosen * marksWrong : 0,
    finalScore: score
  });
  
  // Determine result type
  let result: ResultKind;
  if (correctChosen === 0) {
    result = 'incorrect';
  } else if (correctChosen === correct.size && wrongChosen === 0) {
    result = 'correct';
  } else {
    result = 'partial';
  }
  
  console.log('📊 Final evaluation result:', { result, score });
  
  return { result, score };
}

export function evalNumerical(
  q: TestQuestion,
  resp: UserResponse | undefined,
  testDefaults?: { marksCorrect?: number; marksWrong?: number }
) {
  const { marksCorrect, marksWrong } = getMarks(q, testDefaults);
  if (isUnattempted(resp)) return { result: 'unattempted' as ResultKind, score: 0 };
  const val = Number((resp as any).value);
  const min = q.range?.min ?? Number.NEGATIVE_INFINITY;
  const max = q.range?.max ?? Number.POSITIVE_INFINITY;
  const ok = !Number.isNaN(val) && val >= min && val <= max;
  return { result: (ok ? 'correct' : 'incorrect') as ResultKind, score: ok ? marksCorrect : marksWrong };
}

export function evaluateOne(
  q: TestQuestion,
  resp: UserResponse | undefined,
  timeSec: number,
  testDefaults?: { marksCorrect?: number; marksWrong?: number }
): PerQuestionEval {
  let out: { result: ResultKind; score: number };
  if (q.type === 'MCQ') out = evalMCQ(q, resp, testDefaults);
  else if (q.type === 'MultipleAnswer') out = evalMultiple(q, resp, testDefaults);
  else out = evalNumerical(q, resp, testDefaults);

  // Normalize difficulty to lowercase for consistent grouping
  const difficultyRaw = q.difficultyBand ?? '';
  const difficulty = difficultyRaw.toLowerCase();

  return {
    qid: q.id,
    result: out.result,
    score: out.score,
    timeSec: Math.max(0, Math.floor(timeSec || 0)),
    difficulty: difficulty || 'unknown',
    type: q.type,
    chapter: q.chapter,
    chapterId: q.chapterId,
    skillTags: q.skillTags ?? [],
  };
}

export interface AttemptAnalytics {
  totals: {
    totalQuestions: number;
    attempted: number;
    correct: number;
    incorrect: number;
    partial: number;
    unattempted: number;
    score: number;
    maxScore: number;
    durationSec: number;
  };
  byDifficulty: Record<string, { correct: number; total: number; percent: number }>;
  byChapter: Record<string, { correct: number; total: number; percent: number }>;
  perQuestion: PerQuestionEval[];
}

export function aggregate(
  evals: PerQuestionEval[],
  questions: TestQuestion[],
  durationSec: number,
  testDefaults?: { marksCorrect?: number; marksWrong?: number }
): AttemptAnalytics {
  const totals = {
    totalQuestions: questions.length,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    partial: 0,
    unattempted: 0,
    score: 0,
    maxScore: 0,
    durationSec,
  };

  const byDifficulty: Record<string, { correct: number; total: number; percent: number }> = {};
  const byChapter: Record<string, { correct: number; total: number; percent: number }> = {};

  questions.forEach((q) => {
    const m = getMarks(q, testDefaults).marksCorrect;
    totals.maxScore += m;
  });

  evals.forEach((e) => {
    if (e.result !== 'unattempted') totals.attempted += 1;
    if (e.result === 'correct') totals.correct += 1;
    if (e.result === 'incorrect') totals.incorrect += 1;
    if (e.result === 'partial') totals.partial += 1;
    if (e.result === 'unattempted') totals.unattempted += 1;
    totals.score += e.score;

    // Normalize difficulty key
    const d = e.difficulty && e.difficulty !== 'unknown' ? e.difficulty : 'unknown';
    byDifficulty[d] ??= { correct: 0, total: 0, percent: 0 };
    byDifficulty[d].total += 1;
    if (e.result === 'correct') byDifficulty[d].correct += 1;

    const chap = e.chapter || 'Other';
    byChapter[chap] ??= { correct: 0, total: 0, percent: 0 };
    byChapter[chap].total += 1;
    if (e.result === 'correct') byChapter[chap].correct += 1;
  });

  Object.values(byDifficulty).forEach((b) => {
    b.percent = b.total ? Math.round((b.correct / b.total) * 100) : 0;
  });
  Object.values(byChapter).forEach((b) => {
    b.percent = b.total ? Math.round((b.correct / b.total) * 100) : 0;
  });

  return { totals, byDifficulty, byChapter, perQuestion: evals };
}


