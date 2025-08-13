# Community Feature Documentation

## Overview

The Community feature provides a Reddit-like discussion platform integrated with the Invisible Mechanics learning platform. Users can create threads, post comments, vote on content, and most importantly, ask questions directly from Breakdown slides with embedded context.

## Key Features

### 1. Thread Management
- Create new discussion threads with title, body (Markdown), tags, and images
- View threads sorted by Hot, New, or Top (with time filters)
- Search threads by title or content
- Vote on threads (upvote/downvote)

### 2. Comments System
- Nested comment threads with unlimited depth
- Markdown support for formatting
- Vote on comments
- Collapse/expand comment threads
- Real-time comment count updates

### 3. Breakdown Integration (Special Feature)
- **Ask Community Button**: Appears on every Breakdown slide
- Clicking the button opens a thread composer with the problem/slide context pre-attached
- The embedded slide information is displayed in the thread for future readers
- Deep links back to the original Breakdown problem

### 4. Rich Content Support
- Markdown editor with live preview
- Image uploads (up to 5 images per thread/comment)
- LaTeX rendering for mathematical expressions
- Code formatting with syntax highlighting

## Technical Architecture

### Data Models

#### Thread
```typescript
{
  id: string;
  authorId: string;
  authorName?: string;
  title: string;
  bodyMarkdown: string;
  bodyHtmlSanitized: string;
  images: string[];
  tags: string[];
  score: number;
  commentCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  slug: string;
  breakdownContext?: BreakdownContext;
}
```

#### Comment
```typescript
{
  id: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  parentId: string | null;
  bodyMarkdown: string;
  bodyHtmlSanitized: string;
  score: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Vote
```typescript
{
  id: string;
  userId: string;
  targetType: 'thread' | 'comment';
  targetId: string;
  value: 1 | -1;
  createdAt: Timestamp;
}
```

#### BreakdownContext
```typescript
{
  id: string;
  threadId: string;
  problemId: string;
  slideId: string;
  problemTitle?: string;
  slideTitle?: string;
  snapshotUrl?: string;
  createdAt: Timestamp;
}
```

### Routes

- `/community` - Main feed page
- `/community/new` - Create new thread (protected)
- `/community/t/:threadId` - Thread detail view

### Components

#### Core Components
- `CommunityHome` - Main community page with tabs and search
- `ThreadComposer` - Create new threads with markdown editor
- `ThreadDetail` - View thread with comments
- `Feed` - Paginated list of threads
- `ThreadCard` - Individual thread preview card
- `CommentTree` - Recursive comment rendering
- `CommentComposer` - Add comments/replies
- `VoteWidget` - Upvote/downvote functionality
- `MarkdownEditor` - Rich text editor with toolbar

#### Integration Components
- `AskCommunityButton` - Floating button on Breakdown slides
- `EmbeddedBreakdownSlide` - Shows breakdown context in threads
- `EmbedPreview` - Preview of linked breakdown in composer

### API Endpoints (Future Implementation)

```
POST   /api/community/threads       - Create thread
GET    /api/community/threads       - List threads (with pagination)
GET    /api/community/threads/:id   - Get thread detail
POST   /api/community/comments      - Create comment
POST   /api/community/vote          - Cast vote
POST   /api/uploads/image           - Upload image
GET    /api/community/search        - Search threads
```

## User Flows

### Creating a Thread from Breakdowns
1. User is viewing a Breakdown slide
2. Clicks the "Ask Community" button (bottom-right)
3. Thread composer opens with slide context embedded
4. User writes their question
5. Submits thread and is redirected to the new thread page

### Voting Behavior
- Click upvote: adds +1 vote
- Click same vote again: removes vote (toggle)
- Click opposite vote: switches vote (-2 or +2 change)
- Anonymous users see "Sign in to vote" message

### Comment Threading
- Top-level comments appear directly under the thread
- Replies are indented and connected with a visual line
- Each comment can be collapsed to hide its children
- Reply button opens inline composer

## Security Considerations

1. **Authentication Required For:**
   - Creating threads
   - Posting comments
   - Voting
   - Uploading images

2. **Content Sanitization:**
   - All Markdown is sanitized server-side using DOMPurify
   - Only safe HTML tags and attributes are allowed
   - XSS prevention on all user-generated content

3. **Rate Limiting (To Be Implemented):**
   - Thread creation: 5 per hour
   - Comments: 20 per hour
   - Votes: 100 per hour

## Future Enhancements

1. **Notifications:**
   - Thread replies
   - Comment replies
   - @mentions
   - Vote milestones

2. **Moderation:**
   - Report functionality
   - Admin tools
   - Auto-moderation for spam

3. **Advanced Features:**
   - User reputation system
   - Badges and achievements
   - Thread categories/subcommunities
   - Real-time updates via WebSockets

4. **Analytics:**
   - Popular topics tracking
   - User engagement metrics
   - Question resolution rates

## Testing Checklist

- [ ] Create thread without breakdown context
- [ ] Create thread from breakdown slide
- [ ] Vote on threads and comments
- [ ] Post nested comments
- [ ] Upload images
- [ ] Search functionality
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard navigation, screen readers)
- [ ] Error handling (network failures, validation)

## Performance Optimizations

1. **Implemented:**
   - Lazy loading of community routes
   - Cursor-based pagination
   - Optimistic UI updates for voting

2. **Planned:**
   - Image compression and CDN delivery
   - Comment virtualization for long threads
   - Server-side rendering for SEO
   - Redis caching for hot threads



