# Violation Counting Fix

## Issue Resolved ✅

**Problem**: Violations were being double-counted, showing incorrect progression like "0/3 → 2/3 → 4/3 → 6/3" instead of the expected "0/3 → 1/3 → 2/3 → 3/3 → auto-submit".

**Root Cause**: Multiple event handlers were firing simultaneously when users returned to fullscreen, causing `endViolation()` to be called multiple times for the same violation:

1. **Fullscreen change event** → `endViolation()`
2. **Visibility change event** → `endViolation()` 
3. **Focus event** → `endViolation()`
4. **"Back to Full Screen" button click** → `endViolation()`

Each call was incrementing the strike counter, leading to 2-4 strikes being added per violation instead of 1.

## Solution Applied

### **1. Violation Processing Flag** 🏁

**Problem**: Multiple events calling `endViolation()` simultaneously
**Solution**: Added `violationProcessedRef` to track if a violation was already processed

```typescript
const violationProcessedRef = React.useRef<boolean>(false);

const endViolation = () => {
  // Check if this violation was already processed
  if (violationProcessedRef.current) {
    console.log('🔕 Violation already processed, just clearing timers and state');
    clearTimers();
    setViolation(null);
    return; // Exit without adding another strike
  }
  
  // Mark as processed to prevent double counting
  violationProcessedRef.current = true;
  
  // Add strike for this violation (only once)
  setStrikes(s => s + 1);
};
```

### **2. Reset Flag on New Violation** 🔄

**Problem**: Flag stayed true across different violations
**Solution**: Reset the flag when starting a new violation

```typescript
const startViolation = (reason: string) => {
  // Reset the processed flag for new violation
  violationProcessedRef.current = false;
  
  // Set violation state
  setViolation({ active: true, reason, remaining: graceSeconds });
};
```

### **3. Protected Timeout Scenarios** ⏱️

**Problem**: Both `endViolation()` and timeout could add strikes for the same violation
**Solution**: Added the same protection to timeout scenarios

```typescript
// Main timer timeout
setTimeout(() => {
  if (violationProcessedRef.current) {
    console.log('⚠️ Violation already processed, just auto-submitting');
    autoNow(reason + " (timed out)", false);
    return;
  }
  
  violationProcessedRef.current = true; // Mark as processed
  setStrikes(s => s + 1); // Add strike only once
  autoNow(reason + " (timed out)", false);
}, 50);

// Backup timeout (same protection)
```

## How It Works Now

### **Strike Progression (Fixed):**
1. **Exit 1**: 0/3 → User exits fullscreen, violation starts
2. **Return 1**: 0/3 → 1/3 (only one strike added regardless of multiple events)
3. **Exit 2**: 1/3 → User exits again, new violation starts
4. **Return 2**: 1/3 → 2/3 (only one strike added)
5. **Exit 3**: 2/3 → User exits again, new violation starts
6. **Return 3**: 2/3 → 3/3 (only one strike added, final warning armed)
7. **Exit 4**: **Immediate auto-submit** (no countdown shown)

### **Event Flow Protection:**
```typescript
// Multiple events fire when returning to fullscreen:
onFullscreenChange() → endViolation() → violationProcessedRef.current = true
onVisibilityChange() → endViolation() → sees flag = true, exits early
onFocus() → endViolation() → sees flag = true, exits early
buttonClick() → endViolation() → sees flag = true, exits early

// Result: Only 1 strike added instead of 4
```

## Technical Implementation

### **Idempotent Strike Counting:**
- Each violation can only add exactly 1 strike
- Multiple calls to `endViolation()` are safe
- Timeout and return scenarios are mutually exclusive

### **Race Condition Prevention:**
- Uses `useRef` for immediate synchronous checking
- Flag is reset at the start of each new violation
- Both success and timeout paths check the flag

### **Event Handler Safety:**
- All event handlers (`fullscreen`, `visibility`, `focus`, `button`) can fire safely
- First handler processes the violation and adds strike
- Subsequent handlers are no-ops

## Expected Behavior

### **Before Fix:**
- Exit 1 → Return: 0/3 → 2/3 or 4/3 ❌
- Exit 2 → Return: 2/3 → 4/3 or 6/3 ❌  
- Exit 3 → Return: 4/3 → 6/3 or 8/3 ❌
- Never auto-submits at exactly 3 ❌

### **After Fix:**
- Exit 1 → Return: 0/3 → 1/3 ✅
- Exit 2 → Return: 1/3 → 2/3 ✅
- Exit 3 → Return: 2/3 → 3/3, Final Warning ✅
- Exit 4 → **Immediate auto-submit** ✅

## Console Output Examples

**Normal Violation (Fixed):**
```
🚨 Starting violation: Exited full screen finalArmed: false strikes: 0
⏱️ Setting up new violation with 10 seconds grace period
🔴 Back to Full Screen button clicked
🔄 Immediately ending violation on button click
✅ Ending violation - user returned in time
📊 Strike added for returning in time: 0 → 1 / 3
🔕 Violation already processed, just clearing timers and state (x3 more times)
```

**Final Warning Trigger:**
```
📊 Strike added for returning in time: 2 → 3 / 3
⚠️ Final warning armed - next violation will auto-submit immediately
🔍 TestGuard state: { strikes: 3, finalArmed: true, ... }
```

**Immediate Auto-Submit:**
```
🚨 Starting violation: Exited full screen finalArmed: true strikes: 3
⚡ Final warning armed - immediate auto-submit without countdown
Auto-submitting test: Exited full screen
```

The violation counting now works correctly with exactly 1 strike per violation and auto-submit at exactly 3 strikes.
