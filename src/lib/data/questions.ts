import { collection, getDocs, query, doc, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Slide, TheorySlide, MCQSlide, NumericSlide } from '../components/breakdowns/types';

export interface DiagnosticQuestion {
  id: string;
  stem: string;
  choices: string[];
  answerIdx: number;
  skillTag: string;
  topicId: string;
}

export interface PracticeQuestion {
  id: string;
  title: string;
  text: string;
  type: 'MCQ' | 'Numerical' | 'Multiple Answer';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  chapter: string;
  exam: 'JEE Main' | 'JEE Advanced' | 'NEET';
  options?: string[];
  correct?: number | number[];
  img?: string;
  status: 'Not Attempted' | 'Correct Answer' | 'Wrong Answer';
  // Optional range for numerical questions
  rangeMin?: number;
  rangeMax?: number;
  // Additional fields that might come from Firestore
  answerIndex?: number;
  answerIndices?: number[];
}

export interface FirebaseBreakdownQuestion {
  id: string;
  title: string;
  text: string;
  type: 'MCQ' | 'Numerical' | 'Multiple Answer';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  chapter: string;
  exam: 'JEE Main' | 'JEE Advanced' | 'NEET';
  options?: string[];
  correct?: number | number[];
  img?: string;
  status: 'Not Attempted' | 'Correct Answer' | 'Wrong Answer';
  // Optional range for numerical questions
  rangeMin?: number;
  rangeMax?: number;
  // Additional fields that might come from Firestore
  answerIndex?: number;
  answerIndices?: number[];
}

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  questionCountBreakdowns?: number;
  questionCountPractice?: number;
  questionCountTest?: number;
  subject?: string;
  section?: string;
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
        questionCountBreakdowns: data.questionCountBreakdowns || 0,
        questionCountPractice: data.questionCountPractice || 0,
        questionCountTest: data.questionCountTest || 0,
        subject: data.subject || undefined,
        section: data.section || undefined,
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
 * Fetches practice questions from a specific chapter's practice questions subcollection
 * @param chapterId - The ID of the chapter to fetch questions for
 * @returns Promise<PracticeQuestion[]> - Array of practice questions
 */
export async function getPracticeQuestionsByChapter(chapterId: string): Promise<PracticeQuestion[]> {
  try {
    console.log(`Fetching practice questions from Firestore for chapter: ${chapterId}...`);
    
    // Query the Chapters/{chapterId}/{chapterId}-Practice-Questions subcollection
    const chapterDoc = doc(firestore, 'Chapters', chapterId);
    const questionsCollection = collection(chapterDoc, `${chapterId}-Practice-Questions`);
    const querySnapshot = await getDocs(questionsCollection);

    console.log(`Found ${querySnapshot.docs.length} practice questions in Firestore for ${chapterId}`);
    console.log('Practice question IDs found:', querySnapshot.docs.map(doc => doc.id));
    console.log('Practice questions collection path:', questionsCollection.path);
    
    if (querySnapshot.docs.length === 0) {
      console.log(`No practice questions found for chapter: ${chapterId}`);
      return [];
    }
    
    // Convert documents to question objects
    const allQuestions: PracticeQuestion[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return validateQuestionData(data, doc.id, chapterId) as PracticeQuestion;
    });

    console.log(`Successfully fetched ${allQuestions.length} practice questions for ${chapterId}`);
    return allQuestions;
  } catch (error) {
    console.error(`Failed to fetch practice questions from Firestore for chapter ${chapterId}:`, error);
    return []; // Return empty array instead of throwing to prevent page crashes
  }
}

/**
 * Fetches a specific practice question by ID from all chapters
 * @param questionId - The ID of the question to fetch
 * @param chapterId - The chapter ID to search in (optional, if known)
 * @returns Promise<PracticeQuestion | null> - The practice question or null if not found
 */
export async function getPracticeQuestionById(questionId: string, chapterId?: string): Promise<PracticeQuestion | null> {
  try {
    console.log(`Fetching practice question ${questionId} from Firestore...`);
    
    if (chapterId) {
      // If chapter is known, search only in that chapter
      const questions = await getPracticeQuestionsByChapter(chapterId);
      return questions.find(q => q.id === questionId) || null;
    }
    
    // If chapter is unknown, search in all chapters
    const chapters = await getAllChapters();
    for (const chapter of chapters) {
      const questions = await getPracticeQuestionsByChapter(chapter.id);
      const foundQuestion = questions.find(q => q.id === questionId);
      if (foundQuestion) {
        return foundQuestion;
      }
    }
    
    console.log(`Practice question ${questionId} not found`);
    return null;
  } catch (error) {
    console.error(`Failed to fetch practice question ${questionId}:`, error);
    return null;
  }
}

/**
 * Fetches breakdown questions from a specific chapter's breakdown questions subcollection
 * @param chapterId - The ID of the chapter to fetch questions for
 * @returns Promise<FirebaseBreakdownQuestion[]> - Array of breakdown questions
 */
export async function getBreakdownQuestionsByChapter(chapterId: string): Promise<FirebaseBreakdownQuestion[]> {
  try {
    console.log(`Fetching breakdown questions from Firestore for chapter: ${chapterId}...`);
    
    // Query the Chapters/{chapterId}/{chapterId}-Breakdowns subcollection
    const chapterDoc = doc(firestore, 'Chapters', chapterId);
    const questionsCollection = collection(chapterDoc, `${chapterId}-Breakdowns`);
    const querySnapshot = await getDocs(questionsCollection);

    console.log(`Found ${querySnapshot.docs.length} breakdown questions in Firestore for ${chapterId}`);
    
    if (querySnapshot.docs.length === 0) {
      console.log(`No breakdown questions found for chapter: ${chapterId}`);
      return [];
    }
    
    // Convert documents to question objects
    const allQuestions: FirebaseBreakdownQuestion[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log(`Raw data for ${doc.id}:`, data);
      const validated = validateQuestionData(data, doc.id, chapterId) as FirebaseBreakdownQuestion;
      console.log(`Validated data for ${doc.id}:`, validated);
      return validated;
    });

    console.log(`Successfully fetched ${allQuestions.length} breakdown questions for ${chapterId}`);
    return allQuestions;
  } catch (error) {
    console.error(`Failed to fetch breakdown questions from Firestore for chapter ${chapterId}:`, error);
    return []; // Return empty array instead of throwing to prevent page crashes
  }
}

/**
 * Fetches slides for a specific breakdown question from its Slides subcollection
 * @param chapterId - The ID of the chapter
 * @param questionId - The ID of the breakdown question
 * @returns Promise<Slide[]> - Array of slides for the question
 */
export async function getSlidesByQuestionId(chapterId: string, questionId: string): Promise<Slide[]> {
  try {
    console.log(`Fetching slides from Firestore for question ${questionId} in chapter ${chapterId}...`);
    
    // Query the Chapters/{chapterId}/{chapterId}-Breakdowns/{questionId}/Slides subcollection
    const chapterDoc = doc(firestore, 'Chapters', chapterId);
    const questionDoc = doc(collection(chapterDoc, `${chapterId}-Breakdowns`), questionId);
    const slidesCollection = collection(questionDoc, 'Slides');
    const querySnapshot = await getDocs(slidesCollection);

    console.log(`Found ${querySnapshot.docs.length} slides in Firestore for question ${questionId}`);
    
    if (querySnapshot.docs.length === 0) {
      console.log(`No slides found for question: ${questionId}`);
      return [];
    }
    
    // Convert documents to slide objects
    const allSlides: Slide[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      const rawKind = typeof data.kind === 'string' ? data.kind.toLowerCase() : '';
      const rawType = typeof data.type === 'string' ? data.type.toLowerCase() : '';

      // Normalize commonly used fields
      const title = data.title || data.questionText || 'Untitled Slide';
      const html = data.html || data.content || data.text || data.questionText || '';
      const img = data.img || data.imagePath || data.imageURL || data.imageUrl || undefined;

      // 1) Explicit theory
      if (rawKind === 'theory' || rawType === 'theory') {
        const slide: TheorySlide = {
          id: data.id || doc.id,
          type: 'theory',
          title,
          html,
          img,
        };
        return slide;
      }

      // 2) Question kind (preferred in your admin panel)
      if (rawKind === 'question') {
        const questionText = data.questionText || data.question || '';
        const typeLabel = (data.type || data.questionType || '').toString().toLowerCase();
        const isNumeric = typeLabel.includes('numerical') || typeLabel.includes('numeric') || rawType === 'numerical' || rawType === 'numeric';

        if (isNumeric) {
          const slide: NumericSlide = {
            id: data.id || doc.id,
            type: 'numeric',
            title,
            question: questionText,
            answer: data.answer ?? data.answerIndex ?? 0,
            rangeMin: (data.range && (data.range.min ?? data.rangeMin ?? data.min)) ?? undefined,
            rangeMax: (data.range && (data.range.max ?? data.rangeMax ?? data.max)) ?? undefined,
            hint: data.hint || undefined,
            img,
          };
          return slide;
        }

        // Determine MCQ single vs multi
        const indicatesMulti = typeLabel.includes('multiple answer') || typeLabel.includes('multi');
        const indicatesSingle = typeLabel.includes('single');

        const options = data.choices || data.options || [];
        const correctArrayRaw = Array.isArray(data.correct) ? data.correct
          : Array.isArray(data.answerIndices) ? data.answerIndices
          : [data.answerIndex ?? 0];
        const correctArray = correctArrayRaw.map((v: any) => Number(v));

        const resolvedType: 'mcq-single' | 'mcq-multi' = indicatesMulti
          ? 'mcq-multi'
          : indicatesSingle
          ? 'mcq-single'
          : (Array.isArray(data.answerIndices) && data.answerIndices.length > 1 ? 'mcq-multi' : 'mcq-single');

        const slide: MCQSlide = {
          id: data.id || doc.id,
          type: resolvedType,
          title,
          question: questionText,
          options,
          correct: correctArray,
          hint: data.hint || undefined,
          img,
          // Preserve answerIndex if it exists
          ...(data.answerIndex !== undefined && { answerIndex: data.answerIndex }),
        } as MCQSlide;
        return slide;
      }

      // 3) Backward-compat types
      if (rawType === 'mcq-single' || rawType === 'mcq-multi') {
        const slide: MCQSlide = {
          id: data.id || doc.id,
          type: rawType as 'mcq-single' | 'mcq-multi',
          title,
          question: data.question || data.questionText || '',
          options: data.options || data.choices || [],
          correct: (Array.isArray(data.correct) ? data.correct : [data.correct ?? 0]).map((v: any) => Number(v)),
          hint: data.hint || undefined,
          img,
          // Preserve answerIndex if it exists
          ...(data.answerIndex !== undefined && { answerIndex: data.answerIndex }),
        } as MCQSlide;
        return slide;
      }

      if (rawType === 'numerical' || rawType === 'numeric') {
        const slide: NumericSlide = {
          id: data.id || doc.id,
          type: 'numeric',
          title,
          question: data.question || data.questionText || '',
          answer: data.answer ?? 0,
          rangeMin: (data.range && (data.range.min ?? data.rangeMin ?? data.min)) ?? undefined,
          rangeMax: (data.range && (data.range.max ?? data.rangeMax ?? data.max)) ?? undefined,
          hint: data.hint || undefined,
          img,
        };
        return slide;
      }

      // 4) Default to theory if nothing matched
      const defaultSlide: TheorySlide = {
        id: data.id || doc.id,
        type: 'theory',
        title,
        html,
        img,
      };
      return defaultSlide;
    });

    // Sort slides by order if available, otherwise by id
    const sortedSlides = allSlides.sort((a, b) => {
      const orderA = parseInt((a as any).order) || 0;
      const orderB = parseInt((b as any).order) || 0;
      return orderA - orderB || a.id.localeCompare(b.id);
    });

    console.log(`Successfully fetched ${sortedSlides.length} slides for question ${questionId}`);
    return sortedSlides;
  } catch (error) {
    console.error(`Failed to fetch slides from Firestore for question ${questionId}:`, error);
    return []; // Return empty array instead of throwing to prevent page crashes
  }
}

/**
 * Fetches a specific breakdown question by ID from Firebase
 * @param questionId - The ID of the question to fetch
 * @param chapterId - The chapter ID to search in (optional, if known)
 * @returns Promise<FirebaseBreakdownQuestion | null> - The breakdown question or null if not found
 */
export async function getFirebaseBreakdownQuestionById(questionId: string, chapterId?: string): Promise<FirebaseBreakdownQuestion | null> {
  try {
    console.log(`Fetching breakdown question ${questionId} from Firestore...`);
    
    if (chapterId) {
      // If chapter is known, search only in that chapter
      const questions = await getBreakdownQuestionsByChapter(chapterId);
      return questions.find(q => q.id === questionId) || null;
    }
    
    // If chapter is unknown, search in all chapters
    const chapters = await getAllChapters();
    for (const chapter of chapters) {
      const questions = await getBreakdownQuestionsByChapter(chapter.id);
      const foundQuestion = questions.find(q => q.id === questionId);
      if (foundQuestion) {
        return foundQuestion;
      }
    }
    
    console.log(`Breakdown question ${questionId} not found`);
    return null;
  } catch (error) {
    console.error(`Failed to fetch breakdown question ${questionId}:`, error);
    return null;
  }
}

/**
 * Validates and normalizes question data to prevent undefined field errors
 * @param data - Raw Firebase document data
 * @param docId - Document ID for fallback
 * @param chapterId - Chapter ID for context
 * @returns Normalized question data with all required fields
 */
function validateQuestionData(data: any, docId: string, chapterId: string) {
  // Normalize correct answers to numbers/number[]
  let normalizedCorrect: number | number[] = 0;
  
  // Check all possible field names for the correct answer
  // IMPORTANT: Some single-answer docs include an empty answerIndices: [] alongside answerIndex: number
  // In that case we must ignore the empty array and use answerIndex
  if (Array.isArray(data.answerIndices) && data.answerIndices.length > 0) {
    // Multiple answers stored as answerIndices (for multiple answer questions)
    normalizedCorrect = data.answerIndices.map((c: any) => Number(c));
  } else if (data.answerIndex !== undefined) {
    // Single answer stored as answerIndex (most common for single MCQ breakdown questions)
    normalizedCorrect = Number(data.answerIndex);
  } else if (Array.isArray(data.correct) && data.correct.length > 0) {
    normalizedCorrect = data.correct.map((c: any) => Number(c));
  } else if (data.answerIdx !== undefined) {
    normalizedCorrect = Number(data.answerIdx);
  } else if (data.correct !== undefined) {
    normalizedCorrect = Number(data.correct);
  }

  // Derive question type when not explicitly provided
  let derivedType: 'MCQ' | 'Numerical' | 'Multiple Answer' = 'MCQ';
  if (['MCQ', 'Numerical', 'Multiple Answer'].includes(data.type)) {
    derivedType = data.type as any;
  } else if (Array.isArray(data.answerIndices) && data.answerIndices.length > 1) {
    derivedType = 'Multiple Answer';
  } else if (Array.isArray(normalizedCorrect) && (normalizedCorrect as number[]).length > 1) {
    derivedType = 'Multiple Answer';
  } else if (data.range || data.type === 'Numerical') {
    derivedType = 'Numerical';
  } else {
    derivedType = 'MCQ';
  }

  const result: any = {
    id: data.id || docId,
    title: data.title || data.questionText || data.description || 'Untitled Question',
    text: data.text || data.questionText || data.description || data.stem || '',
    type: derivedType,
    difficulty: data.difficulty && ['Easy', 'Medium', 'Hard'].includes(data.difficulty) ? data.difficulty : 'Medium',
    chapter: chapterId,
    exam: data.exam && ['JEE Main', 'JEE Advanced', 'NEET'].includes(data.exam) ? data.exam : 'JEE Main',
    options: Array.isArray(data.choices) ? data.choices : 
              Array.isArray(data.options) ? data.options : 
              Array.isArray(data.answerChoices) ? data.answerChoices : [],
    correct: normalizedCorrect,
    img: data.img || data.imagePath || data.imageURL || data.imageUrl || undefined,
    status: data.status && ['Not Attempted', 'Correct Answer', 'Wrong Answer'].includes(data.status) ? 
            data.status : 'Not Attempted',
    rangeMin: (data.range && (data.range.min ?? data.rangeMin ?? data.min)) ?? undefined,
    rangeMax: (data.range && (data.range.max ?? data.rangeMax ?? data.max)) ?? undefined,
  };
  
  // Preserve the original answerIndex and answerIndices fields if they exist
  if (data.answerIndex !== undefined) {
    result.answerIndex = data.answerIndex;
  }
  if (data.answerIndices !== undefined) {
    result.answerIndices = data.answerIndices;
  }
  
  console.log('validateQuestionData - normalized result:', result);
  console.log('validateQuestionData - result.correct:', result.correct);
  
  return result;
}

/**
 * Get answer slides for a specific practice question
 * Fetches from: Chapters/{chapterId}/{chapterId}-Practice-Questions/{questionId}/Slides
 * @param chapterId - Chapter identifier
 * @param questionId - Question identifier
 * @returns Promise<Slide[]> - Array of answer slides
 */
export async function getAnswerSlidesByQuestionId(chapterId: string, questionId: string): Promise<Slide[]> {
  try {
    console.log('Fetching answer slides for question:', questionId, 'in chapter:', chapterId);
    
    // Try the direct path approach first
    console.log('Using direct Firestore path...');
    const slidesCollection = collection(firestore, 'Chapters', chapterId, `${chapterId}-Practice-Questions`, questionId, 'Slides');
    console.log('Direct slides collection path:', slidesCollection.path);
    
    // Also create the traditional references for fallback
    const chapterDoc = doc(firestore, 'Chapters', chapterId);
    const practiceQuestionsCollection = collection(chapterDoc, `${chapterId}-Practice-Questions`);
    const questionDoc = doc(practiceQuestionsCollection, questionId);
    console.log('Fallback question doc path:', questionDoc.path);
    
    // Try to fetch slides without any query constraints first
    console.log('Attempting to fetch slides directly from collection...');
    let querySnapshot;
    
    try {
      // First try direct collection fetch
      querySnapshot = await getDocs(slidesCollection);
      console.log('Direct collection fetch result:', querySnapshot.size);
      
      // If that worked but we want ordering, try with orderBy
      if (querySnapshot.size > 0) {
        try {
          const orderedQuery = query(slidesCollection, orderBy('order', 'asc'));
          const orderedSnapshot = await getDocs(orderedQuery);
          console.log('Ordered query result:', orderedSnapshot.size);
          if (orderedSnapshot.size > 0) {
            querySnapshot = orderedSnapshot;
          }
        } catch (orderError) {
          console.log('Order field not found, using unordered results:', orderError);
          // Keep the original querySnapshot
        }
      }
    } catch (fetchError) {
      console.error('Failed to fetch slides collection:', fetchError);
      return [];
    }

    console.log('Answer slides query snapshot size:', querySnapshot.size);
    console.log('Collection path:', `Chapters/${chapterId}/${chapterId}-Practice-Questions/${questionId}/Slides`);

    if (querySnapshot.empty) {
      console.log('No slides found in collection');
      console.log('Collection path used:', slidesCollection.path);
      console.log('Question doc exists:', questionDoc.path);
      
      // Try alternative approaches to fetch the slide
      console.log('Trying alternative fetch methods...');
      
      // Try using the traditional nested document approach as fallback
      try {
        console.log('Trying fallback method with nested documents...');
        const fallbackSlidesCollection = collection(questionDoc, 'Slides');
        console.log('Fallback slides collection path:', fallbackSlidesCollection.path);
        const fallbackQuerySnapshot = await getDocs(fallbackSlidesCollection);
        console.log('Fallback method query result:', fallbackQuerySnapshot.size);
        
        if (fallbackQuerySnapshot.size > 0) {
          querySnapshot = fallbackQuerySnapshot;
          console.log('Fallback method succeeded!');
        }
      } catch (e) {
        console.log('Fallback method failed:', e);
      }
      
      // If still empty, return
      if (querySnapshot.empty) {
        return [];
      }
    }

    console.log('Found slides:', querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));

    const allSlides: Slide[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log('Processing answer slide data for doc ID:', doc.id, 'Data:', data);

      // More flexible type detection - check for common variations
      const slideType = data.type || data.slideType || data.kind || 'theory';
      console.log('Detected slide type:', slideType, 'from data.type:', data.type, 'data.kind:', data.kind);
      
      if (slideType === 'theory' || slideType === 'Theory') {
        const slide: TheorySlide = {
          id: data.id || doc.id,
          type: 'theory',
          title: data.title || data.questionText || 'Untitled Slide',
          html: data.html || data.content || data.text || 'No content available',
          img: data.img || data.imagePath || data.imageURL || data.imageUrl || undefined,
        };
        console.log('Created theory slide:', slide);
        return slide;
      } else if (slideType === 'mcq' || slideType === 'MCQ') {
        const slide: MCQSlide = {
          id: data.id || doc.id,
          type: 'mcq',
          title: data.title || data.questionText || 'Untitled Question',
          html: data.html || data.content || data.text || '',
          img: data.img || data.imagePath || data.imageURL || data.imageUrl || undefined,
          options: Array.isArray(data.choices) ? data.choices : 
                   Array.isArray(data.options) ? data.options : 
                   Array.isArray(data.answerChoices) ? data.answerChoices : [],
          correct: data.correct !== undefined ? data.correct : 
                   data.answerIndex !== undefined ? data.answerIndex :
                   data.answerIdx !== undefined ? data.answerIdx : 0,
        };
        console.log('Created MCQ slide:', slide);
        return slide;
      } else if (slideType === 'numeric' || slideType === 'Numeric' || slideType === 'numerical') {
        const slide: NumericSlide = {
          id: data.id || doc.id,
          type: 'numeric',
          title: data.title || data.questionText || 'Untitled Question',
          html: data.html || data.content || data.text || '',
          img: data.img || data.imagePath || data.imageURL || data.imageUrl || undefined,
          answer: data.answer || data.correctAnswer || 0,
        };
        console.log('Created numeric slide:', slide);
        return slide;
      } else {
        // Default to theory slide if type is unknown or missing
        console.log('Unknown slide type, defaulting to theory:', slideType);
        const slide: TheorySlide = {
          id: data.id || doc.id,
          type: 'theory',
          title: data.title || data.questionText || 'Untitled Slide',
          html: data.html || data.content || data.text || 'No content available',
          img: data.img || data.imagePath || data.imageURL || data.imageUrl || undefined,
        };
        console.log('Created default theory slide:', slide);
        return slide;
      }
    });

    // Sort slides by order if available, otherwise maintain document order
    const sortedSlides = allSlides.sort((a, b) => {
      const docA = querySnapshot.docs.find(doc => doc.id === a.id);
      const docB = querySnapshot.docs.find(doc => doc.id === b.id);
      const orderA = docA?.data().order || docA?.data().slideOrder || 0;
      const orderB = docB?.data().order || docB?.data().slideOrder || 0;
      return orderA - orderB;
    });

    console.log('Fetched answer slides count:', sortedSlides.length);
    console.log('Answer slides:', sortedSlides);
    return sortedSlides;
  } catch (error) {
    console.error('Error fetching answer slides:', error);
    console.error('Error details:', {
      chapterId,
      questionId,
      error: error.message,
      stack: error.stack
    });
    return [];
  }
}

/**
 * Fisher-Yates shuffle algorithm to randomize array
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}