# Partial Scoring Debug Fix

## Issue Identified & Fixed ✅

**Problem**: MultipleAnswer questions were still showing "Incorrect, -2" instead of "+2" for selecting 2 correct options, even with partial scoring enabled in the admin panel.

**Root Cause**: The `partialCorrect` field was not being properly mapped from the Firestore question data to the test question object, so the evaluation logic was always using all-or-nothing scoring.

## The Fix

### **1. Added Missing Field Mapping** 🔧

**In `services/tests.ts` - `AttemptQuestion` Interface:**
```typescript
export interface AttemptQuestion {
  // ... existing fields ...
  partialCorrect?: boolean; // ← Added this field
  // ... metadata fields ...
}
```

**In `getHydratedTest()` Function:**
```typescript
questions.push({
  // ... existing mappings ...
  partialCorrect: qData.partialCorrect || questionContent.partialCorrect || false, // ← Added this mapping
});
```

### **2. Enhanced Debugging** 🔍

**Added comprehensive logging to `evalMultiple()`:**
```typescript
console.log('🔍 MultipleAnswer Evaluation Debug:', {
  questionId: q.id,
  partialCorrect: q.partialCorrect, // ← This will show if partial scoring is enabled
  correctAnswers: Array.from(correct),
  userChoices: Array.from(chosen),
  correctChosen,
  wrongChosen,
  marksCorrect,
  marksWrong
});

if (!q.partialCorrect) {
  console.log('📊 Using all-or-nothing scoring (partialCorrect=false)');
  // ... all-or-nothing logic
} else {
  console.log('📊 Using partial scoring (partialCorrect=true)');
  // ... partial scoring logic
}

console.log('📊 Partial scoring calculation:', {
  baseScore: correctChosen,
  negativeMarks: wrongChosen > 0 && marksWrong < 0 ? wrongChosen * marksWrong : 0,
  finalScore: score
});

console.log('📊 Final evaluation result:', { result, score });
```

## How to Debug

### **Console Output to Look For:**

#### **If Partial Scoring is Working:**
```
🔍 MultipleAnswer Evaluation Debug: {
  questionId: "question-5",
  partialCorrect: true,           ← Should be true
  correctAnswers: [0, 1, 3],      ← Indices of correct options (A, B, D)
  userChoices: [0, 1],            ← User selected A, B
  correctChosen: 2,               ← User got 2 correct
  wrongChosen: 0,                 ← User got 0 wrong
  marksCorrect: 4,
  marksWrong: -0.5
}
📊 Using partial scoring (partialCorrect=true)
📊 Partial scoring calculation: {
  baseScore: 2,                   ← +1 per correct = +2
  negativeMarks: 0,               ← No wrong choices
  finalScore: 2                   ← Final score = +2
}
📊 Final evaluation result: { result: "partial", score: 2 }
```

#### **If Partial Scoring is NOT Working:**
```
🔍 MultipleAnswer Evaluation Debug: {
  questionId: "question-5",
  partialCorrect: false,          ← This is the problem!
  // ... rest of debug info
}
📊 Using all-or-nothing scoring (partialCorrect=false)
```

## Expected Behavior After Fix

### **For Your Example (A, B both correct):**
- **User selected**: A, B (both correct)
- **Correct chosen**: 2
- **Wrong chosen**: 0
- **Score calculation**: 2 × (+1) + 0 × (-0.5) = **+2**
- **Result**: "Partial, +2" (or "Correct, +2" if all correct options selected)

### **Other Examples:**
- **Select A, B, C (2 correct, 1 wrong)**: 2 - 0.5 = **+1.5**
- **Select A only (1 correct)**: **+1**
- **Select A, C, D (1 correct, 2 wrong)**: 1 - 1.0 = **0**

## Testing Steps

1. **Take a new mock test** (to ensure fresh evaluation)
2. **Select some correct options** in a MultipleAnswer question
3. **Check browser console** for debug logs during submission
4. **Verify `partialCorrect: true`** in the debug output
5. **Check final score** should be positive (+1 per correct option)

## Important Notes

- ✅ **New tests**: Will use the fixed scoring logic
- ⚠️ **Old test results**: May still show old scores (already stored in database)
- ✅ **Admin panel**: The "Partial Scoring Scheme" checkbox should now work properly
- ✅ **Debug logs**: Will help identify if `partialCorrect` is being set correctly

The fix ensures that the `partialCorrect` flag is properly read from the Firestore question configuration and applied during evaluation, enabling +1 scoring per correct option as intended.
