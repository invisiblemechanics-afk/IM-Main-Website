# Partial Scheme Structure Fix

## Issue Fixed ✅

**Problem**: The partial marking evaluation logic was using incorrect field names (`partialCorrect`) instead of the actual Firestore structure (`partialScheme.mode` and `perOptionMarks`).

**Root Cause**: The evaluation logic was checking for `q.partialCorrect` but the actual Firestore structure uses:
- `partialScheme: { mode: "perOption" }`
- `perOptionMarks: 1`
- `marksWrong: -2`

## The Fix

### **1. Updated Data Structures** 📊

**Enhanced `TestQuestion` interface:**
```typescript
export interface TestQuestion {
  // ... existing fields ...
  partialCorrect?: boolean; // Legacy support
  partialScheme?: { mode?: string }; // New partial scoring structure
  perOptionMarks?: number; // Marks per correct option in partial scoring
}
```

**Enhanced `AttemptQuestion` interface:**
```typescript
export interface AttemptQuestion {
  // ... existing fields ...
  partialCorrect?: boolean;
  partialScheme?: { mode?: string };
  perOptionMarks?: number;
}
```

### **2. Fixed Field Mapping** 🔧

**In `services/tests.ts` - `getHydratedTest()`:**
```typescript
questions.push({
  // ... existing mappings ...
  partialCorrect: qData.partialCorrect || questionContent.partialCorrect || false,
  partialScheme: qData.partialScheme || questionContent.partialScheme || undefined,
  perOptionMarks: qData.perOptionMarks || questionContent.perOptionMarks || undefined,
});
```

### **3. Updated Evaluation Logic** ⚡

**Enhanced partial scoring detection:**
```typescript
// Check if partial scoring is enabled (check both old and new formats)
const hasPartialScoring = q.partialCorrect || (q.partialScheme?.mode === 'perOption');
const perOptionMarks = q.perOptionMarks || 1; // Default to 1 mark per option
```

**Fixed scoring calculation:**
```typescript
if (!hasPartialScoring) {
  // All-or-nothing scoring
  const exact = wrongChosen === 0 && correctChosen === correct.size && chosen.size === correct.size;
  return { result: (exact ? 'correct' : 'incorrect'), score: exact ? marksCorrect : marksWrong };
}

// Partial scoring: use perOptionMarks for each correct option
let score = correctChosen * perOptionMarks; // e.g., 2 correct × 1 mark = +2

// Apply negative marking for wrong choices
if (wrongChosen > 0 && marksWrong < 0) {
  score += wrongChosen * marksWrong; // e.g., + (1 wrong × -2) = -2
}
```

### **4. Enhanced Debug Logging** 🔍

**Comprehensive evaluation debugging:**
```typescript
console.log('🔍 MultipleAnswer Evaluation Debug:', {
  questionId: q.id,
  partialCorrect: q.partialCorrect,
  partialScheme: q.partialScheme,        ← Shows { mode: "perOption" }
  perOptionMarks: q.perOptionMarks,      ← Shows 1
  hasPartialScoring,                     ← Should be true
  correctAnswers: Array.from(correct),   ← Shows [0, 1, 3] (A, B, D)
  userChoices: Array.from(chosen),       ← Shows [0, 1] (A, B)
  correctChosen,                         ← Shows 2
  wrongChosen,                           ← Shows 0
  marksCorrect,
  marksWrong                             ← Shows -2
});

console.log('📊 Partial scoring calculation:', {
  correctChosen: 2,
  perOptionMarks: 1,
  baseScore: 2,                          ← 2 × 1 = +2
  wrongChosen: 0,
  marksWrong: -2,
  negativeMarks: 0,                      ← 0 × -2 = 0
  finalScore: 2                          ← +2 final score
});
```

## Expected Results

### **For Your Example (A, B both correct):**

#### **Firestore Configuration:**
- `partialScheme: { mode: "perOption" }`
- `perOptionMarks: 1`
- `marksWrong: -2`

#### **User Selection:** A, B (both correct)
- **Correct chosen**: 2
- **Wrong chosen**: 0
- **Score**: 2 × 1 + 0 × (-2) = **+2**
- **Result**: "Partial, +2" or "Correct, +2"

#### **Console Output:**
```
📊 Using partial scoring - perOption mode
📊 Partial scoring calculation: { correctChosen: 2, perOptionMarks: 1, baseScore: 2, finalScore: 2 }
📊 Final evaluation result: { result: "partial", score: 2 }
```

## Testing

1. **Take a new mock test** (to use the updated evaluation logic)
2. **Answer MultipleAnswer questions** with some correct options
3. **Check browser console** for the debug logs during submission
4. **Verify results** should show positive scores for correct options

The fix ensures that the evaluation logic properly reads and uses the Firestore partial scoring configuration (`partialScheme.mode: "perOption"` and `perOptionMarks: 1`) to award the correct marks.
