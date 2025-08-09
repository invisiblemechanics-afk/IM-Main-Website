export type SlideQuestionType = 'MCQ' | 'MultipleAnswer' | 'Numerical';

export type NormalizedSlideQuestion = {
  type: SlideQuestionType;
  choices: string[];              // as-rendered order
  correctIndex?: number;          // MCQ only (0-based)
  correctIndices?: number[];      // MultipleAnswer (0-based)
  range?: { min: number; max: number }; // Numerical
};

export function normalizeSlideQuestion(raw: any): NormalizedSlideQuestion {
  // Safely coerce numbers while staying 0-based
  const toInt = (v: any) =>
    typeof v === 'number' && Number.isFinite(v) ? v : Number.parseInt(String(v ?? ''), 10);

  // Get choices array
  const choices = Array.isArray(raw?.choices) ? raw.choices.slice() : [];

  // Determine question type from Firestore data
  const rawType = (raw?.type || '').toString().toLowerCase();
  let type: SlideQuestionType = 'MCQ'; // default
  
  if (rawType.includes('multiple') || rawType.includes('multi')) {
    type = 'MultipleAnswer';
  } else if (rawType.includes('numerical') || rawType.includes('numeric')) {
    type = 'Numerical';
  }

  let correctIndex: number | undefined = undefined;
  let correctIndices: number[] | undefined = undefined;

  if (type === 'MCQ') {
    // For single answer MCQ, use answerIndex directly from Firestore
    if (raw?.answerIndex !== undefined && raw?.answerIndex !== null) {
      const idx = toInt(raw.answerIndex);
      correctIndex = Number.isFinite(idx) ? idx : undefined;
    }
  } else if (type === 'MultipleAnswer') {
    // For multiple answer, use answerIndices array
    if (Array.isArray(raw?.answerIndices)) {
      correctIndices = raw.answerIndices.map(toInt).filter(Number.isFinite);
    }
  }

  const range =
    type === 'Numerical' && raw?.range
      ? { min: Number(raw.range.min), max: Number(raw.range.max) }
      : undefined;

  const result = { type, choices, correctIndex, correctIndices, range };
  
  return result;
}
