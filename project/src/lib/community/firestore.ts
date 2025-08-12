import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  writeBatch,
  increment,
  QueryDocumentSnapshot,
  DocumentData,
  runTransaction,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { Thread, Comment, Vote, Author, computeHotRank } from './models';
import { threadConverter, commentConverter, voteConverter } from './converters';
import { generateSlug, sanitizeMarkdown } from './utils';
import { requireAuth } from '../auth/currentUser';

// Thread operations
export async function createThread(
  title: string,
  bodyMarkdown: string,
  images: string[] = [],
  tags: string[] = [],
  breakdown?: { problemId: string; slideId: string; snapshotUrl?: string }
): Promise<Thread> {
  const author = await requireAuth();

  const threadId = doc(collection(firestore, 'threads')).id;
  const now = Timestamp.now();
  const slug = generateSlug(title);
  
  const thread: Thread = {
    id: threadId,
    title,
    bodyMarkdown,
    bodyHtmlSanitized: sanitizeMarkdown(bodyMarkdown),
    images,
    tags,
    author,
    createdAt: now,
    updatedAt: now,
    score: 0,
    commentCount: 0,
    hotRank: 0,
    slug,
    breakdown: breakdown || null
  };

  await setDoc(
    doc(firestore, 'threads', threadId).withConverter(threadConverter),
    thread
  );

  return thread;
}

export async function getThreads(
  sortBy: 'hot' | 'new' | 'top' = 'hot',
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  limitCount: number = 20
): Promise<{ threads: Thread[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(collection(firestore, 'threads').withConverter(threadConverter));

  switch (sortBy) {
    case 'new':
      q = query(q, orderBy('createdAt', 'desc'));
      break;
    case 'top':
      q = query(q, orderBy('score', 'desc'), orderBy('createdAt', 'desc'));
      break;
    case 'hot':
    default:
      q = query(q, orderBy('hotRank', 'desc'), orderBy('createdAt', 'desc'));
      break;
  }

  q = query(q, limit(limitCount));
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const threads = snapshot.docs.map(doc => doc.data());

  return {
    threads,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
  };
}

export async function getThread(threadId: string): Promise<Thread | null> {
  const threadDoc = await getDoc(
    doc(firestore, 'threads', threadId).withConverter(threadConverter)
  );
  
  return threadDoc.exists() ? threadDoc.data() : null;
}

// Comment operations
export async function createComment(
  threadId: string,
  bodyMarkdown: string,
  parentId?: string
): Promise<Comment> {
  const author = await requireAuth();

  const batch = writeBatch(firestore);
  const commentId = doc(collection(firestore, 'threads', threadId, 'comments')).id;
  const now = Timestamp.now();
  
  const comment: Comment = {
    id: commentId,
    threadId,
    parentId: parentId || null,
    bodyMarkdown,
    bodyHtmlSanitized: sanitizeMarkdown(bodyMarkdown),
    author,
    createdAt: now,
    updatedAt: now,
    score: 0
  };

  // Add comment
  batch.set(
    doc(firestore, 'threads', threadId, 'comments', commentId).withConverter(commentConverter),
    comment
  );

  // Update thread comment count
  batch.update(doc(firestore, 'threads', threadId), {
    commentCount: increment(1),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
  return comment;
}

export async function getComments(threadId: string): Promise<Comment[]> {
  const q = query(
    collection(firestore, 'threads', threadId, 'comments').withConverter(commentConverter),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

// Vote operations
export async function voteThread(
  threadId: string, 
  userId: string, 
  value: 1 | -1
): Promise<void> {
  const threadRef = doc(firestore, 'threads', threadId);
  const voteRef = doc(firestore, 'threads', threadId, 'votes', userId);

  await runTransaction(firestore, async (txn) => {
    const [threadSnap, voteSnap] = await Promise.all([
      txn.get(threadRef),
      txn.get(voteRef)
    ]);
    
    if (!threadSnap.exists()) {
      throw new Error('Thread not found');
    }

    const thread = threadSnap.data() as any;
    const prev = voteSnap.exists() ? (voteSnap.data()!.value as 1 | -1) : 0;

    let delta = 0;
    const now = Timestamp.now();

    if (prev === value) {
      // Toggle off - remove vote
      delta = -prev;
      txn.delete(voteRef);
    } else if (prev === 0) {
      // New vote
      delta = value;
      const vote: Vote = {
        userId,
        value,
        createdAt: now,
        updatedAt: now
      };
      txn.set(voteRef.withConverter(voteConverter), vote);
    } else {
      // Change vote
      delta = value - prev;
      txn.update(voteRef, { 
        value, 
        updatedAt: now 
      });
    }

    // Update thread score and hot rank
    const createdAtMs = thread.createdAt.toMillis?.() || thread.createdAt.seconds * 1000;
    const newScore = (thread.score || 0) + delta;
    const hotRank = computeHotRank(newScore, createdAtMs);

    txn.update(threadRef, {
      score: newScore,
      hotRank,
      updatedAt: now
    });
  });
}

export async function voteComment(
  threadId: string,
  commentId: string,
  userId: string,
  value: 1 | -1
): Promise<void> {
  const commentRef = doc(firestore, 'threads', threadId, 'comments', commentId);
  const voteRef = doc(firestore, 'threads', threadId, 'comments', commentId, 'votes', userId);

  await runTransaction(firestore, async (txn) => {
    const [commentSnap, voteSnap] = await Promise.all([
      txn.get(commentRef),
      txn.get(voteRef)
    ]);
    
    if (!commentSnap.exists()) {
      throw new Error('Comment not found');
    }

    const prev = voteSnap.exists() ? (voteSnap.data()!.value as 1 | -1) : 0;
    let delta = 0;
    const now = Timestamp.now();

    if (prev === value) {
      // Toggle off - remove vote
      delta = -prev;
      txn.delete(voteRef);
    } else if (prev === 0) {
      // New vote
      delta = value;
      const vote: Vote = {
        userId,
        value,
        createdAt: now,
        updatedAt: now
      };
      txn.set(voteRef.withConverter(voteConverter), vote);
    } else {
      // Change vote
      delta = value - prev;
      txn.update(voteRef, { 
        value, 
        updatedAt: now 
      });
    }

    // Update comment score
    const currentScore = commentSnap.data()!.score || 0;
    txn.update(commentRef, {
      score: currentScore + delta,
      updatedAt: now
    });
  });
}

// Get user votes for a list of items
export async function getUserVotes(
  userId: string,
  threadId: string,
  targetIds: string[],
  targetType: 'thread' | 'comment'
): Promise<Record<string, 1 | -1>> {
  if (!userId || targetIds.length === 0) return {};

  const votes: Record<string, 1 | -1> = {};

  // For threads, we only need to check the thread itself
  if (targetType === 'thread' && targetIds.includes(threadId)) {
    const voteDoc = await getDoc(
      doc(firestore, 'threads', threadId, 'votes', userId).withConverter(voteConverter)
    );
    if (voteDoc.exists()) {
      votes[threadId] = voteDoc.data().value;
    }
  }

  // For comments, check each comment's vote subcollection
  if (targetType === 'comment') {
    const votePromises = targetIds.map(async (commentId) => {
      const voteDoc = await getDoc(
        doc(firestore, 'threads', threadId, 'comments', commentId, 'votes', userId).withConverter(voteConverter)
      );
      if (voteDoc.exists()) {
        votes[commentId] = voteDoc.data().value;
      }
    });
    await Promise.all(votePromises);
  }

  return votes;
}
