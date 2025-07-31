import { OptionState } from './types';

export function evaluateSingle(correct: number, chosen: number): OptionState {
  return correct === chosen ? 'green' : 'red';
}

export function evaluateMulti(correct: number[], chosen: number[]): OptionState[] {
  const correctSet = new Set(correct);
  const chosenSet = new Set(chosen);
  
  // Check if any wrong option was selected
  const hasWrongChoice = chosen.some(c => !correctSet.has(c));
  if (hasWrongChoice) {
    // All chosen options are red
    return Array.from({ length: 4 }, (_, i) => chosen.includes(i) ? 'red' : 'neutral');
  }
  
  // Check if all correct options were selected
  const allCorrectSelected = correct.every(c => chosenSet.has(c));
  if (allCorrectSelected && chosen.length === correct.length) {
    // All correct options are green
    return Array.from({ length: 4 }, (_, i) => correct.includes(i) ? 'green' : 'neutral');
  }
  
  // Some but not all correct options selected (yellow)
  return Array.from({ length: 4 }, (_, i) => {
    if (correct.includes(i) && chosen.includes(i)) return 'yellow';
    if (!correct.includes(i) && chosen.includes(i)) return 'red';
    return 'neutral';
  });
}

export function evaluateNumeric(correct: number | number[], value: number | number[]): OptionState {
  if (Array.isArray(correct) && Array.isArray(value)) {
    return correct.every((c, i) => Math.abs(c - value[i]) < 0.01) ? 'green' : 'red';
  }
  if (!Array.isArray(correct) && !Array.isArray(value)) {
    return Math.abs(correct - value) < 0.01 ? 'green' : 'red';
  }
  return 'red';
}