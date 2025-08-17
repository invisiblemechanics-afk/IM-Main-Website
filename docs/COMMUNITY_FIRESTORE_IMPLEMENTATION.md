# Community Firestore Implementation

## Overview

Successfully implemented Firestore persistence for the Community feature without changing any other site behavior. All Community data (threads, comments, votes) now persists in Cloud Firestore with proper security rules and data structure.

## Key Changes

### 1. Data Models (`lib/community/models.ts`)

Created exact data models as specified:
- **Author**: Includes required `username` field alongside id, displayName, and avatarUrl
- **Thread**: Contains author object (not just authorId), with embedded breakdown context
- **Comment**: Uses same Author structure
- **Vote**: Simplified structure for subcollection storage
- **computeHotRank**: Function for calculating hot ranking score

### 2. Firestore Structure

Implemented the specified subcollection layout:
```
threads/{threadId} (Thread)
  comments/{commentId} (Comment)
    votes/{userId} (Vote)
  votes/{userId} (Vote)
```

Benefits:
- Idempotent voting (vote doc ID = userId)
- Efficient per-thread comment queries
- Easy vote management

### 3. Security Rules

Updated `firestore.rules` with:
- Public read access for threads/comments
- Authentication required for create/update/delete
- Author-only updates (must match auth.uid)
- Required username field validation
- Vote value validation (only 1 or -1)

### 4. Composite Indexes

Added to `firestore.indexes.json`:
- threads: createdAt desc
- threads: score desc, createdAt desc
- threads: hotRank desc, createdAt desc
- comments: createdAt asc
- comments: score desc, createdAt desc

### 5. Username Implementation

Created `lib/auth/currentUser.ts`:
- Derives stable username from available user data
- Priority: displayName → email → phoneNumber → uid
- Removes spaces and special characters
- Always returns a username for authenticated users

### 6. Firestore Integration

#### Converters (`lib/community/converters.ts`)
- Type-safe converters for Thread, Comment, Vote
- Automatic timestamp handling
- Proper null/undefined handling

#### Firestore Helpers (`lib/community/firestore.ts`)
- `createThread`: Creates thread with author info and hot rank
- `getThreads`: Supports hot/new/top sorting with pagination
- `createComment`: Uses batch writes for atomic updates
- `voteThread/voteComment`: Transactional voting with score updates
- `getUserVotes`: Batch fetches user votes from subcollections

#### Service Updates (`services/community.ts`)
- Updated to use new Firestore helpers
- Maintains same interface for components
- Handles subcollection structure for votes

### 7. Component Updates

Updated all components to work with new data structure:
- **ThreadComposer**: Uses `threadService.createThread`
- **CommentComposer**: Uses `commentService.createComment`
- **VoteWidget**: Passes threadId for comment votes
- **ThreadCard/CommentTree**: Display author.username
- **ThreadDetail**: Embedded breakdown context

## Data Flow

1. **Thread Creation**:
   - User fills form → getCurrentUser() gets author info
   - Creates thread with author.username
   - Embeds breakdown context if from Breakdowns
   - Calculates initial hotRank

2. **Voting**:
   - Transaction reads current vote
   - Calculates delta (-1, 0, 1, or 2)
   - Updates/deletes vote doc
   - Updates target score and hotRank

3. **Comments**:
   - Stored as subcollection under thread
   - Batch write updates thread.commentCount
   - Maintains author.username

## Testing Checklist

- [x] TypeScript compilation passes
- [x] Build completes successfully
- [ ] Thread creation persists with username
- [ ] Comments persist under thread subcollection
- [ ] Voting updates scores correctly
- [ ] Hot ranking sorts properly
- [ ] Pagination works with Firestore cursors
- [ ] Security rules enforce authentication
- [ ] Username displays instead of "Anonymous"

## Deployment Steps

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. Deploy application
4. Monitor for any permission errors

## Notes

- Client-side search remains unchanged (future: Algolia/ElasticSearch)
- Hot rank recalculation happens on each vote (future: scheduled job)
- Image uploads still use existing service
- No changes to other features (Practice, Mock Tests, etc.)



