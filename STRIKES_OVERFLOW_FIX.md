# Strikes Overflow Fix

## Issue Fixed ✅

**Problem**: The violations counter was going beyond 3 (showing 4/3, 5/3, 6/3, etc.) instead of auto-submitting when it reached the limit.

**Root Cause**: The strike counting logic was incrementing strikes in multiple places without checking if it would exceed the maximum limit. The auto-submit check was only happening at the start of new violations, but strikes were being added in timeout handlers and `endViolation()` without bounds checking.

## The Fix

### **Two-Part Solution** 🔧

#### **1. Early Auto-Submit Check**
```typescript
const startViolation = (reason: string) => {
  // If we already have 3 strikes, auto-submit immediately - don't allow more violations
  if (strikes >= maxGraceIncidents) {
    console.log('⚡ STRIKES AT LIMIT (' + strikes + '/' + maxGraceIncidents + ') - IMMEDIATE AUTO-SUBMIT');
    autoNow(reason + ' (limit exceeded)', false);
    return; // Stop processing - no countdown modal
  }
  // ... rest of violation logic
}
```

#### **2. Capped Strike Counting**
```typescript
// All strike increments now use Math.min() to cap at maxGraceIncidents (3)

// Timeout handler:
setStrikes((s) => {
  const next = Math.min(s + 1, maxGraceIncidents); // Cap at max
  return next;
});

// Backup timeout handler:
setStrikes((s) => {
  const next = Math.min(s + 1, maxGraceIncidents); // Cap at max
  return next;
});

// endViolation (user returns):
setStrikes((s) => {
  const next = Math.min(s + 1, maxGraceIncidents); // Cap at max
  return next;
});
```

### **How It Works Now** 

#### **Strike Progression (Fixed):**
1. **0/3**: First violation → countdown → returns → **1/3**
2. **1/3**: Second violation → countdown → returns → **2/3**
3. **2/3**: Third violation → countdown → returns → **3/3**
4. **3/3**: Fourth violation → **IMMEDIATE AUTO-SUBMIT** (no countdown)

#### **Key Changes:**
- **Early Check**: `startViolation()` immediately auto-submits if `strikes >= 3`
- **Bounded Counting**: All `setStrikes()` calls use `Math.min(s + 1, maxGraceIncidents)`
- **No Overflow**: Strikes can never exceed 3, so UI will never show 4/3, 5/3, etc.

## Expected Behavior

### **Console Output:**
```
// Normal violations (0-2 strikes):
🚨 Starting violation: Exited full screen current strikes: 2 maxGraceIncidents: 3
⏱️ Setting up new violation with 10 seconds grace period

// At limit (3 strikes):
🚨 Starting violation: Exited full screen current strikes: 3 maxGraceIncidents: 3
⚡ STRIKES AT LIMIT (3/3) - IMMEDIATE AUTO-SUBMIT
Auto-submitting test: Exited full screen (limit exceeded)
```

### **UI Display:**
- **Strikes 0/3, 1/3, 2/3**: Shows countdown modal
- **Strikes 3/3**: Shows "Final Warning" when in fullscreen
- **Next violation**: **Immediate auto-submit** - no modal, no counting beyond 3

## Testing

1. **Start test** → Enter fullscreen
2. **Exit 3 times** → Return each time to build strikes: 0→1→2→3
3. **Check UI** → Should show "3/3" with Final Warning
4. **Exit 4th time** → Should **immediately auto-submit** without showing countdown
5. **Verify** → Strikes counter should never exceed "3/3"

The fix ensures that strikes are capped at the maximum limit and auto-submission occurs immediately when the limit is reached, preventing the counter from overflowing.
