import { collection, getDocs, query } from 'firebase/firestore';
import { firestore } from '../firebase';

export interface DiagnosticQuestion {
  id: string;
  stem: string;
  choices: string[];
  answerIdx: number;
  skillTag: string;
  topicId: string;
}

/**
 * Fetches 15 random questions from the "Vectors - Questions" collection in Firestore
 * @returns Promise<DiagnosticQuestion[]> - Array of 15 random questions
 */
export async function getRandomDiagnosticQuestions(): Promise<DiagnosticQuestion[]> {
  try {
    console.log('Fetching questions from Firestore...');
    
    // Query the Vectors - Questions collection
    const questionsCollection = collection(firestore, 'Vectors - Questions');
    const querySnapshot = await getDocs(questionsCollection);

    console.log(`Found ${querySnapshot.docs.length} questions in Firestore`);
    
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

    // Shuffle and select 10 random questions
    const shuffledQuestions = shuffleArray([...allQuestions]);
    const selectedQuestions = shuffledQuestions.slice(0, 15);

    console.log(`Selected ${selectedQuestions.length} random questions for diagnostic`);
    return selectedQuestions;
  } catch (error) {
    console.error('Failed to fetch questions from Firestore:', error);
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