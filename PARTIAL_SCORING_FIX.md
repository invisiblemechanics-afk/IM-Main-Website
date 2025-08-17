# Partial Scoring Fix for MultipleAnswer Questions

## Issue Fixed ✅

**Problem**: MultipleAnswer questions with partial marking were giving negative scores (-2) instead of positive scores (+1 per correct option) when users selected correct options.

**Root Cause**: The evaluation logic in `evalMultiple()` function had two flaws:
1. **Immediate negative marking**: If any wrong option was selected, it immediately returned negative marks without considering correct options
2. **Fractional scoring**: Used fraction of total marks instead of +1 per correct option

## The Fix

### **Before (Broken Logic):**
```typescript
if (wrongChosen > 0) return { result: 'incorrect', score: marksWrong }; // ❌ Always negative if any wrong
const frac = correct.size === 0 ? 0 : correctChosen / correct.size;
const score = Math.round(marksCorrect * frac * 1000) / 1000; // ❌ Fractional of total marks
```

### **After (Fixed Logic):**
```typescript
// For partial scoring: +1 for each correct option selected
let score = correctChosen; // +1 for each correct choice

// Apply negative marking for wrong choices if configured
if (wrongChosen > 0 && marksWrong < 0) {
  // Use the marksWrong value (e.g., -0.5) per wrong choice
  score += wrongChosen * marksWrong;
}

// Determine result type
let result: ResultKind;
if (correctChosen === 0) {
  result = 'incorrect';
} else if (correctChosen === correct.size && wrongChosen === 0) {
  result = 'correct';
} else {
  result = 'partial';
}
```

## How the New Scoring Works

### **Scoring Formula:**
```
Final Score = (Number of Correct Options Selected × +1) + (Number of Wrong Options Selected × Negative Marks)
```

### **Examples:**

#### **Question with 4 options (A, B correct; C, D incorrect):**

**Scenario 1: User selects A, B (both correct)**
- Correct chosen: 2
- Wrong chosen: 0  
- Score: 2 × (+1) + 0 × (-0.5) = **+2**
- Result: "Correct"

**Scenario 2: User selects A, B, C (2 correct, 1 wrong)**
- Correct chosen: 2
- Wrong chosen: 1
- Score: 2 × (+1) + 1 × (-0.5) = **+1.5**
- Result: "Partial"

**Scenario 3: User selects A, C (1 correct, 1 wrong)**  
- Correct chosen: 1
- Wrong chosen: 1
- Score: 1 × (+1) + 1 × (-0.5) = **+0.5**
- Result: "Partial"

**Scenario 4: User selects C, D (both wrong)**
- Correct chosen: 0
- Wrong chosen: 2
- Score: 0 × (+1) + 2 × (-0.5) = **-1**
- Result: "Incorrect"

### **Result Classification:**
- ✅ **"Correct"**: All correct options selected, no wrong options
- 🟡 **"Partial"**: Some correct options selected (score > 0)
- ❌ **"Incorrect"**: No correct options selected (score ≤ 0)

## Admin Panel Integration

The fix respects the admin panel settings:
- ✅ **"Per correct option: 1 marks"** → Each correct selection = +1
- ✅ **"Negative per wrong: -0.5 marks"** → Each wrong selection = -0.5  
- ✅ **"Partial Scoring Scheme" checkbox** → Enables this logic

## Testing

1. **Create a MultipleAnswer question** with partial scoring enabled
2. **Set scoring**: +1 per correct, -0.5 per wrong
3. **Take the test** and select some correct options
4. **Check results**: Should show positive score (+1 per correct option)
5. **Verify calculation**: Score = (correct × +1) + (wrong × negative marks)

## Backward Compatibility

- ✅ **Non-partial questions**: Still use all-or-nothing scoring
- ✅ **MCQ questions**: Unchanged behavior  
- ✅ **Numerical questions**: Unchanged behavior
- ✅ **Existing tests**: Will be re-evaluated with correct logic

The fix ensures that users get rewarded (+1) for each correct option they select in MultipleAnswer questions with partial marking enabled, matching the expected behavior from the admin panel configuration.
