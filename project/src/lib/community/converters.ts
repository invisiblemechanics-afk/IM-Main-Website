import { 
  FirestoreDataConverter, 
  QueryDocumentSnapshot, 
  SnapshotOptions, 
  DocumentData,
  Timestamp 
} from 'firebase/firestore';
import { Thread, Comment, Vote } from './models';

export const threadConverter: FirestoreDataConverter<Thread> = {
  toFirestore(thread: Thread): DocumentData {
    const { id, ...data } = thread;
    return {
      ...data,
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now()
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Thread {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title,
      bodyMarkdown: data.bodyMarkdown,
      bodyHtmlSanitized: data.bodyHtmlSanitized,
      images: data.images || [],
      tags: data.tags || [],
      author: data.author,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      score: data.score || 0,
      commentCount: data.commentCount || 0,
      hotRank: data.hotRank || 0,
      slug: data.slug,
      breakdown: data.breakdown || null
    };
  }
};

export const commentConverter: FirestoreDataConverter<Comment> = {
  toFirestore(comment: Comment): DocumentData {
    const { id, ...data } = comment;
    return {
      ...data,
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now()
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Comment {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      threadId: data.threadId,
      parentId: data.parentId || null,
      bodyMarkdown: data.bodyMarkdown,
      bodyHtmlSanitized: data.bodyHtmlSanitized,
      author: data.author,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      score: data.score || 0
    };
  }
};

export const voteConverter: FirestoreDataConverter<Vote> = {
  toFirestore(vote: Vote): DocumentData {
    return {
      ...vote,
      createdAt: vote.createdAt || Timestamp.now(),
      updatedAt: vote.updatedAt || Timestamp.now()
    };
  },

  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Vote {
    const data = snapshot.data(options);
    return {
      userId: data.userId,
      value: data.value as 1 | -1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }
};



