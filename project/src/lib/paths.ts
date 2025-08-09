// src/lib/paths.ts
import { collection } from 'firebase/firestore';
import { firestore } from './firebase'; // existing Firebase init

export const slidesCol = (chapterId: string, breakdownId: string) => {
  const path = `Chapters/${chapterId}/${chapterId}-Breakdowns/${breakdownId}/Slides`;
  console.log(`🔍 Constructing slides collection path: ${path}`);
  return collection(firestore, 'Chapters', chapterId, `${chapterId}-Breakdowns`, breakdownId, 'Slides');
};
