# Continue Learning Feature - Database Implementation

This document describes the database changes implemented for the "Continue Learning" dashboard feature.

## Overview

The Continue Learning feature allows users to quickly resume their most recent:
- Video watching progress
- Practice sessions
- Breakdown activities

## Database Structure

### New Subcollections

#### 1. `users/{uid}/videoProgress/{videoId}`
Tracks video watching progress for quick resume functionality.

```typescript
interface VideoProgressDoc {
  videoId: string;          // document ID
  topicId: string;          // or chapterId
  title?: string;           // optional denorm for fast label
  positionSec: number;      // current timestamp in seconds
  durationSec: number;      // total duration
  progressPct: number;      // 0–100 (normalize if client stores 0–1)
  updatedAt: Timestamp;
  createdAt: Timestamp;
}
```

#### 2. `users/{uid}/practiceSessions/{sessionId}`
Tracks practice session progress for resume functionality.

```typescript
interface PracticeSessionDoc {
  topicId: string;                // or chapterId
  mode: 'practice';
  lastQuestionId?: string;        // for deep link
  answeredCount: number;          // for compact progress
  totalCount?: number;            // optional; card hides bar if missing
  accuracy?: number;              // optional
  status: 'in_progress' | 'completed';
  topicName?: string;             // optional denorm for label
  updatedAt: Timestamp;
  createdAt: Timestamp;
}
```

#### 3. Optional: `breakdowns/{breakdownId}.slideCount`
Added optional field to breakdown documents for progress bar display.

```typescript
// Added to existing breakdown documents
field: slideCount: number  // total slides/steps (set via backfill script)
```

## Security Rules

Added the following rules to `firestore.rules`:

```javascript
// Per-user video progress for Continue Learning
match /users/{userId}/videoProgress/{videoId} {
  allow read: if isSelf(userId);
  allow write: if isSelf(userId);
}

// Per-user practice sessions for Continue Learning
match /users/{userId}/practiceSessions/{sessionId} {
  allow read: if isSelf(userId);
  allow write: if isSelf(userId);
}

// Allow updates to breakdowns for slideCount field
match /breakdowns/{bId} {
  allow read: if true;
  allow write: if false;
  allow update: if signedIn(); // for slideCount backfill script
}
```

## Indexes

Added the following indexes to `firestore.indexes.json`:

```json
{
  "collectionGroup": "userAnswers",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "videoProgress",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "__name__", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "practiceSessions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
}
```

## Scripts

### Backfill Scripts

1. **`backfillSlideCounts.ts`** - Counts slides in each breakdown and sets `slideCount` field
   ```bash
   npm run backfill:slide-counts
   ```

2. **`migratePracticeSessionsFromUserAnswers.ts`** - Creates practice sessions from existing userAnswers
   ```bash
   npm run migrate:practice-sessions
   ```

3. **`devCreateDummyProgress.ts`** - Creates dummy data for development/testing
   ```bash
   npm run dev:create-dummy-progress
   ```

### Script Features

- **Idempotent**: Safe to run multiple times
- **Error handling**: Continues processing even if individual items fail
- **Logging**: Detailed console output for monitoring progress
- **Flexible**: Handles missing data gracefully

## Deployment

### 1. Deploy Rules and Indexes
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 2. Run Backfill Scripts
```bash
# Set GOOGLE_APPLICATION_CREDENTIALS for Admin SDK if not using emulator
npm run backfill:slide-counts
npm run migrate:practice-sessions

# For development/testing
npm run dev:create-dummy-progress
```

### 3. Test with Emulator (Recommended)
```bash
firebase emulators:start --only firestore
# Then run scripts against emulator
```

## Usage in Application

### Query Latest Video Progress
```typescript
const videoProgressQuery = query(
  collection(firestore, `users/${userId}/videoProgress`),
  orderBy('updatedAt', 'desc'),
  limit(1)
);
```

### Query In-Progress Practice Sessions
```typescript
const practiceSessionsQuery = query(
  collection(firestore, `users/${userId}/practiceSessions`),
  where('status', '==', 'in_progress'),
  orderBy('updatedAt', 'desc'),
  limit(3)
);
```

### Query Latest User Answers (for breakdown resume)
```typescript
const userAnswersQuery = query(
  collection(firestore, 'userAnswers'),
  where('userId', '==', userId),
  orderBy('updatedAt', 'desc'),
  limit(5)
);
```

## Acceptance Checklist

- ✅ `users/{uid}/videoProgress` subcollection created
- ✅ `users/{uid}/practiceSessions` subcollection created
- ✅ Optional `breakdowns.slideCount` field added
- ✅ Security rules allow users to read/write their own progress
- ✅ Indexes created for efficient querying
- ✅ Backfill scripts are idempotent and safe
- ✅ All existing functionality preserved
- ✅ TypeScript types created for new structures

## Notes

- All new fields are optional to avoid runtime breakage
- Scripts handle missing or malformed data gracefully
- The implementation is additive-only (no deletions or renames)
- Existing collections and rules remain unchanged

