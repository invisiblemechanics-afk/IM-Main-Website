import { collection, getDocs, query, doc } from 'firebase/firestore';
import { firestore } from '../firebase';

export interface DiagnosticQuestion {
  id: string;
  stem: string;
  choices: string[];
  answerIdx: number;
  skillTag: string;
  topicId: string;
}

export interface Chapter {
  id: string;
  name: string;
  description?: string;
}

/**
 * Fetches all available chapters from the Chapters collection in Firestore
 * @returns Promise<Chapter[]> - Array of available chapters
 */
export async function getAllChapters(): Promise<Chapter[]> {
  try {
    console.log('Fetching chapters from Firestore...');
    
    const chaptersCollection = collection(firestore, 'Chapters');
    const querySnapshot = await getDocs(chaptersCollection);

    console.log(`Found ${querySnapshot.docs.length} chapters in Firestore`);
    
    // Convert documents to chapter objects
    const chapters: Chapter[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id, // Use doc.id as fallback name
        description: data.description || undefined,
      };
    });

    return chapters;
  } catch (error) {
    console.error('Failed to fetch chapters from Firestore:', error);
    throw error;
  }
}

/**
 * Fetches 15 random questions from a specific chapter's diagnostic questions subcollection
 * @param chapterId - The ID of the chapter to fetch questions for
 * @returns Promise<DiagnosticQuestion[]> - Array of 15 random questions
 */
export async function getRandomDiagnosticQuestions(chapterId: string = 'Vectors'): Promise<DiagnosticQuestion[]> {
  try {
    console.log(`Fetching questions from Firestore for chapter: ${chapterId}...`);
    
    // Query the Chapters/{chapterId}/{chapterId}-Diagnostic-Questions subcollection
    const chapterDoc = doc(firestore, 'Chapters', chapterId);
    const questionsCollection = collection(chapterDoc, `${chapterId}-Diagnostic-Questions`);
    const querySnapshot = await getDocs(questionsCollection);

    console.log(`Found ${querySnapshot.docs.length} questions in Firestore for ${chapterId}`);
    
    if (querySnapshot.docs.length === 0) {
      throw new Error(`No diagnostic questions found for chapter: ${chapterId}`);
    }
    
    // Convert documents to question objects
    const allQuestions: DiagnosticQuestion[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id || doc.id,
        stem: data.stem,
        choices: data.choices,
        answerIdx: data.answerIdx,
        skillTag: data.skillTag,
        topicId: data.topicId, // ensure topic association travels with question
      };
    });

    // Shuffle and select up to 15 random questions
    const shuffledQuestions = shuffleArray([...allQuestions]);
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(15, shuffledQuestions.length));

    console.log(`Selected ${selectedQuestions.length} random questions for diagnostic from ${chapterId}`);
    return selectedQuestions;
  } catch (error) {
    console.error(`Failed to fetch questions from Firestore for chapter ${chapterId}:`, error);
    throw error;
  }
}

/**
 * Fisher-Yates shuffle algorithm to randomize array
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}