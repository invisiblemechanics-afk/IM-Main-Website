import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { firestore as db } from '../lib/firebase';



export type AttemptQuestionType = 'MCQ' | 'MultipleAnswer' | 'Numerical';

export interface AttemptQuestion {
  id: string;
  type: AttemptQuestionType;
  title?: string;
  questionText: string;
  imageUrl?: string;
  choices?: string[];
  answerIndex?: number;
  answerIndices?: number[];
  range?: { min: number; max: number };
  marksCorrect?: number;
  marksWrong?: number;
  partialCorrect?: boolean;
  partialScheme?: { mode?: string };
  perOptionMarks?: number;
  // Metadata for analytics
  difficultyBand?: string;
  chapter?: string;
  chapterId?: string;
  skillTags?: string[];
}

export interface HydratedTest {
  id: string;
  name: string;
  exam: string;
  durationMinutes: number;
  questions: AttemptQuestion[];
}

export async function getHydratedTest(testId: string): Promise<HydratedTest> {
  const testRef = doc(db, 'Tests', testId);
  const testSnap = await getDoc(testRef);
  if (!testSnap.exists()) throw new Error('Test not found');

  const testData = testSnap.data() as any;

  const qSnap = await getDocs(collection(testRef, 'Questions'));
  const questions: AttemptQuestion[] = [];

  for (const qDoc of qSnap.docs) {
    const qData = qDoc.data() as any;
    
    // Debug logging can be enabled here if needed
    // console.log(`Question ${qDoc.id} data:`, qData);
    
    // Try to fetch the actual question content from the chapter documents if needed for question text/choices
    let questionContent = qData; // Default to the Questions subcollection data
    
    if (qData.chapterId && qData.questionId) {
      const chapter = qData.chapterId;
      const qid = qData.questionId;
      const collName = `${chapter}-Test-Questions`;
      const ref = doc(db, 'Chapters', chapter, collName, qid);
      try {
        const dataSnap = await getDoc(ref);
        if (dataSnap.exists()) {
          const chapterData = dataSnap.data();
          // Only merge question content, keep metadata from Questions subcollection
          questionContent = { ...qData, ...chapterData, difficultyBand: qData.difficultyBand, skillTags: qData.skillTags };
        }
      } catch (error) {
        console.warn(`Failed to fetch question content from chapter: ${error}`);
        // Continue with qData as fallback
      }
    }

    questions.push({
      id: qDoc.id, // Use the Questions subcollection document ID
      type: (qData.type || questionContent.type) as AttemptQuestionType,
      title: questionContent.title || qData.title || '',
      questionText: questionContent.questionText || questionContent.description || qData.questionText || qData.description || '',
      imageUrl: questionContent.imageUrl || qData.imageUrl || '',
      choices: questionContent.choices || qData.choices || [],
      answerIndex: typeof questionContent.answerIndex === 'number' ? questionContent.answerIndex : 
                   typeof qData.answerIndex === 'number' ? qData.answerIndex : undefined,
      answerIndices: Array.isArray(questionContent.answerIndices) ? questionContent.answerIndices : 
                     Array.isArray(qData.answerIndices) ? qData.answerIndices : undefined,
      range: questionContent.range || qData.range || undefined,
      marksCorrect:
        typeof qData.marksCorrect === 'number' ? qData.marksCorrect : 
        typeof questionContent.marksCorrect === 'number' ? questionContent.marksCorrect : 
        testData.defaultMarksCorrect ?? 4,
      marksWrong:
        typeof qData.marksWrong === 'number' ? qData.marksWrong :
        typeof questionContent.marksWrong === 'number' ? questionContent.marksWrong :
        testData.defaultMarksWrong ?? -1,
      // Extract metadata directly from Questions subcollection
      difficultyBand: qData.difficultyBand || undefined,
      chapter: qData.chapterId || qData.chapter || undefined,
      chapterId: qData.chapterId || qData.chapter || undefined,
      skillTags: Array.isArray(qData.skillTags) ? qData.skillTags : [],
      partialCorrect: qData.partialCorrect || questionContent.partialCorrect || false,
      partialScheme: qData.partialScheme || questionContent.partialScheme || undefined,
      perOptionMarks: qData.perOptionMarks || questionContent.perOptionMarks || undefined,
    });

    // Debug metadata extraction if needed
    // console.log(`Extracted metadata for question ${qDoc.id}`);
  }

  return {
    id: testSnap.id,
    name: testData.name || 'Mock Test',
    exam: testData.exam || 'JEE Main',
    durationMinutes: testData.durationMinutes || testData.duration || (testData.durationSec ? Math.round(testData.durationSec / 60) : 180),
    questions,
  };
}


