import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import type { Chapter, Breakdown, Slide, UserAnswers, UserAnswerEntry } from '../../types/firebase';

// Chapter helpers
export async function getChapters(): Promise<Chapter[]> {
  const chaptersRef = collection(firestore, 'chapters');
  const snapshot = await getDocs(chaptersRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chapter & { id: string }));
}

export async function getChapter(chapterId: string): Promise<Chapter | null> {
  const chapterRef = doc(firestore, 'chapters', chapterId);
  const snapshot = await getDoc(chapterRef);
  return snapshot.exists() ? snapshot.data() as Chapter : null;
}

// Breakdown helpers
export async function getBreakdownsByChapter(chapterId: string): Promise<(Breakdown & { id: string })[]> {
  const breakdownsRef = collection(firestore, 'breakdowns');
  const q = query(breakdownsRef, where('chapterId', '==', chapterId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Breakdown & { id: string }));
}

export async function getBreakdown(breakdownId: string): Promise<(Breakdown & { id: string }) | null> {
  const breakdownRef = doc(firestore, 'breakdowns', breakdownId);
  const snapshot = await getDoc(breakdownRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Breakdown & { id: string } : null;
}

// Slide helpers
export async function getSlides(breakdownId: string): Promise<(Slide & { id: string })[]> {
  const slidesRef = collection(firestore, 'breakdowns', breakdownId, 'slides');
  const snapshot = await getDocs(slidesRef);
  // Sort by document ID (which should be numeric)
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Slide & { id: string }))
    .sort((a, b) => parseInt(a.id) - parseInt(b.id));
}

// User answer helpers
export async function getUserAnswers(breakdownId: string): Promise<UserAnswers | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const answersRef = collection(firestore, 'userAnswers');
  const q = query(
    answersRef, 
    where('userId', '==', user.uid),
    where('breakdownId', '==', breakdownId)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as UserAnswers;
}

export async function saveUserAnswer(
  breakdownId: string,
  slideId: string,
  answer: UserAnswerEntry
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const answersRef = collection(firestore, 'userAnswers');
  const q = query(
    answersRef,
    where('userId', '==', user.uid),
    where('breakdownId', '==', breakdownId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new document
    await setDoc(doc(answersRef), {
      userId: user.uid,
      breakdownId,
      answers: {
        [slideId]: answer
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    // Update existing document
    const docRef = snapshot.docs[0].ref;
    const currentData = snapshot.docs[0].data() as UserAnswers;
    await updateDoc(docRef, {
      answers: {
        ...currentData.answers,
        [slideId]: answer
      },
      updatedAt: serverTimestamp()
    });
  }
}