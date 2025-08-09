import { OptionState } from './types';

export function evaluateSingle(correct: number, chosen: number): OptionState {
  return correct === chosen ? 'green' : 'red';
}

/**
 * If indices appear to be 1-based (no zero and all within 1..optionsLength), convert them to 0-based.
 * Otherwise, return as-is.
 */
export function normalizeIndicesIfOneBased(indices: number[], optionsLength: number): number[] {
  if (!indices || indices.length === 0) return indices ?? [];
  const hasZero = indices.includes(0);
  const min = Math.min(...indices);
  const max = Math.max(...indices);
  const looksOneBased = !hasZero && min >= 1 && max <= optionsLength;
  return looksOneBased ? indices.map((i) => i - 1) : indices;
}

export function evaluateMulti(correct: number[], chosen: number[], optionsCount: number = 4): OptionState[] {
  const correctSet = new Set(correct);
  const chosenSet = new Set(chosen);

  // Any wrong option → all chosen red
  const hasWrongChoice = chosen.some(c => !correctSet.has(c));
  if (hasWrongChoice) {
    // Requirement: if any wrong is chosen, turn ALL options red
    return Array.from({ length: optionsCount }, () => 'red');
  }

  // All correct chosen and counts match → all correct green
  const allCorrectSelected = correct.every(c => chosenSet.has(c));
  if (allCorrectSelected && chosen.length === correct.length) {
    return Array.from({ length: optionsCount }, (_, i) => correct.includes(i) ? 'green' : 'neutral');
  }

  // Partial correct (no wrongs) → chosen correct yellow; others neutral
  return Array.from({ length: optionsCount }, (_, i) => {
    if (correct.includes(i) && chosen.includes(i)) return 'yellow';
    return 'neutral';
  });
}

export function evaluateNumeric(
  correct: number | number[] | undefined,
  value: number | number[] | undefined,
  inclusiveRange?: { min?: number; max?: number }
): OptionState {
  // Prefer range validation when provided
  if (inclusiveRange && typeof value === 'number') {
    const { min, max } = inclusiveRange;
    if (min !== undefined && value < min) return 'red';
    if (max !== undefined && value > max) return 'red';
    return 'green';
  }

  if (correct === undefined || value === undefined) return 'red';

  if (Array.isArray(correct) && Array.isArray(value)) {
    return correct.every((c, i) => Math.abs(c - (value[i] ?? NaN)) < 0.01) ? 'green' : 'red';
  }
  if (!Array.isArray(correct) && !Array.isArray(value)) {
    return Math.abs(correct - value) < 0.01 ? 'green' : 'red';
  }
  return 'red';
}