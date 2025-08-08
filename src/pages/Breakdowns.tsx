import React, { useState, useMemo, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllChapters } from '../lib/data/questions';
import { Logo } from '../components/Logo';
import { CircularCheckbox } from '../components/CircularCheckbox';
import { BreakdownQuestionCard } from '../components/breakdowns/BreakdownQuestionCard';
import { SlideDeck } from '../components/breakdowns/SlideDeck';
import { OptionBlock } from '../components/breakdowns/OptionBlock';
import { FirebaseImage } from '../components/breakdowns/FirebaseImage';
import { evaluateMulti, evaluateNumeric } from '../components/breakdowns/utils';
import { OptionState } from '../components/breakdowns/types';
import { LaTeXRenderer } from '../components/LaTeXRenderer';
import { 
  getBreakdownQuestionsByChapter, 
  getFirebaseBreakdownQuestionById, 
  getSlidesByQuestionId,
  FirebaseBreakdownQuestion 
} from '../lib/data/questions';
import { Slide } from '../components/breakdowns/types';
import styles from '../components/breakdowns/breakdowns.module.css';

type ViewMode = 'list' | 'question' | 'slides';
type QuestionType = 'MCQ' | 'Multiple Answer' | 'Numerical';
type AttemptStatus = 'Not Attempted' | 'Correct Answer' | 'Wrong Answer';
type ExamType = 'JEE Main' | 'JEE Advanced' | 'NEET';

interface FirebaseChapter {
  id: string;
  name: string;
  description?: string;
  questionCountBreakdowns?: number;
  questionCountPractice?: number;
  questionCountTest?: number;
  subject?: string;
  section?: string;
}

export const Breakdowns: React.FC = () => {
  const { user, loading } = useAuth();
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    document.title = 'Breakdowns - Invisible Mechanics';
  }, []);
  const [selectedQuestion, setSelectedQuestion] = useState<FirebaseBreakdownQuestion | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [optionStates, setOptionStates] = useState<OptionState[]>([]);
  const [numericValue, setNumericValue] = useState<string>('');
  
  // Firebase chapters state
  const [firebaseChapters, setFirebaseChapters] = useState<FirebaseChapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  
  // Firebase breakdown questions state
  const [breakdownQuestions, setBreakdownQuestions] = useState<FirebaseBreakdownQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  
  // Slides state for SlideDeck
  const [currentSlides, setCurrentSlides] = useState<Slide[]>([]);
  const [slidesLoading, setSlidesLoading] = useState(false);
  
  // Filter states
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<Set<QuestionType>>(new Set(['MCQ', 'Multiple Answer', 'Numerical']));
  const [selectedAttemptStatuses, setSelectedAttemptStatuses] = useState<Set<AttemptStatus>>(new Set(['Not Attempted', 'Correct Answer', 'Wrong Answer']));
  const [selectedExamTypes, setSelectedExamTypes] = useState<Set<ExamType>>(new Set(['JEE Main', 'JEE Advanced', 'NEET']));

  // Load chapters from Firebase (only once on mount)
  useEffect(() => {
    const loadChapters = async () => {
      try {
        setChaptersLoading(true);
        setChaptersError(null);
        console.log('Loading chapters from Firebase for Breakdowns page...');
        
        const chapters = await getAllChapters();
        console.log('Loaded chapters:', chapters);
        
        setFirebaseChapters(chapters);
        
        // Set default chapter to first available chapter from Firebase
        if (chapters.length > 0) {
          setSelectedChapter(chapters[0].id);
        }
      } catch (error) {
        console.error('Error loading chapters:', error);
        setChaptersError('Failed to load chapters from Firebase');
      } finally {
        setChaptersLoading(false);
      }
    };

    loadChapters();
  }, []);

  // Load breakdown questions when selected chapter changes
  useEffect(() => {
    const loadBreakdownQuestions = async () => {
      if (!selectedChapter) {
        setBreakdownQuestions([]);
        return;
      }

      try {
        setQuestionsLoading(true);
        console.log('Loading breakdown questions for chapter:', selectedChapter);
        
        const questions = await getBreakdownQuestionsByChapter(selectedChapter);
        console.log('Loaded breakdown questions:', questions);
        
        setBreakdownQuestions(questions);
      } catch (error) {
        console.error('Error loading breakdown questions:', error);
        setBreakdownQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadBreakdownQuestions();
  }, [selectedChapter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return breakdownQuestions.filter(question => {
      const typeMatch = selectedQuestionTypes.has(question.type);
      const statusMatch = selectedAttemptStatuses.has(question.status);
      const examMatch = selectedExamTypes.has(question.exam);
      return typeMatch && statusMatch && examMatch;
    });
  }, [breakdownQuestions, selectedQuestionTypes, selectedAttemptStatuses, selectedExamTypes]);

  // Filter handlers
  const handleQuestionTypeToggle = (type: QuestionType) => {
    const newTypes = new Set(selectedQuestionTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedQuestionTypes(newTypes);
  };

  const handleAttemptStatusToggle = (status: AttemptStatus) => {
    const newStatuses = new Set(selectedAttemptStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedAttemptStatuses(newStatuses);
  };

  const handleExamTypeToggle = (exam: ExamType) => {
    const newExamTypes = new Set(selectedExamTypes);
    if (newExamTypes.has(exam)) {
      newExamTypes.delete(exam);
    } else {
      newExamTypes.add(exam);
    }
    setSelectedExamTypes(newExamTypes);
  };

  // Chapter change handler that resets all relevant states
  const handleChapterChange = (chapterId: string) => {
    console.log('Changing chapter to:', chapterId);
    setSelectedChapter(chapterId);
    
    // Reset all question-related states to prevent glitches
    setViewMode('list');
    setSelectedQuestion(null);
    setSelectedOptions([]);
    setIsSubmitted(false);
    setOptionStates([]);
  };

  const handleQuestionClick = async (questionId: string) => {
    try {
      const question = await getFirebaseBreakdownQuestionById(questionId, selectedChapter);
      console.log('handleQuestionClick - fetched question:', question);
      if (question) {
        setSelectedQuestion(question);
        setViewMode('question');
        setSelectedOptions([]);
        setIsSubmitted(false);
        setNumericValue('');
        if (question.options) {
          setOptionStates(Array(question.options.length).fill('neutral'));
        } else if (question.type === 'Numerical') {
          setOptionStates(['neutral']);
        }
      }
    } catch (error) {
      console.error('Error loading breakdown question:', error);
    }
  };

  const handleOptionClick = (index: number) => {
    if (isSubmitted || !selectedQuestion) return;

    if (selectedQuestion.type === 'MCQ') {
      setSelectedOptions([index]);
      const newStates = Array(selectedQuestion.options?.length || 0).fill('neutral') as OptionState[];
      newStates[index] = 'purple';
      setOptionStates(newStates);
    } else if (selectedQuestion.type === 'Multiple Answer') {
      const newSelected = selectedOptions.includes(index)
        ? selectedOptions.filter(i => i !== index)
        : [...selectedOptions, index];
      setSelectedOptions(newSelected);
      
      const newStates = Array(selectedQuestion.options?.length || 0).fill('neutral') as OptionState[];
      newSelected.forEach(i => newStates[i] = 'purple');
      setOptionStates(newStates);
    }
  };

  const handleSubmit = () => {
    if (!selectedQuestion) return;

    // Log for debugging
    console.log('Breakdown handleSubmit - selectedQuestion.correct:', selectedQuestion.correct);
    console.log('Breakdown handleSubmit - selectedQuestion.answerIndex:', (selectedQuestion as any).answerIndex);
    console.log('Breakdown handleSubmit - selectedQuestion:', selectedQuestion);
    console.log('Breakdown handleSubmit - selectedOptions:', selectedOptions);

    // Normalize correct answers to numbers
    // For breakdown questions, the answer might be stored as 'answerIndex' instead of 'correct'
    let correctValue = selectedQuestion.correct;
    
    // Try multiple field names for the correct answer
    if (correctValue === undefined || correctValue === null) {
      if (selectedQuestion.answerIndex !== undefined) {
        correctValue = selectedQuestion.answerIndex;
        console.log('Using answerIndex field:', correctValue);
      } else if ('answerIdx' in selectedQuestion && (selectedQuestion as any).answerIdx !== undefined) {
        correctValue = (selectedQuestion as any).answerIdx;
        console.log('Using answerIdx field:', correctValue);
      }
    }
    
    console.log('Final correctValue:', correctValue);
    
    const correctAnswersArray: number[] = Array.isArray(correctValue)
      ? correctValue.map((c: any) => Number(c))
      : correctValue !== undefined && correctValue !== null 
        ? [Number(correctValue)]
        : [0];

    console.log('Breakdown handleSubmit - correctAnswersArray before normalization:', correctAnswersArray);
    console.log('Breakdown handleSubmit - correctAnswersArray type:', typeof correctAnswersArray, 'isArray:', Array.isArray(correctAnswersArray));
    console.log('Breakdown handleSubmit - correctAnswersArray[0]:', correctAnswersArray[0]);

    if (selectedQuestion.type === 'MCQ') {
      // Single correct
      if (selectedOptions.length === 0) return;
      const chosen = selectedOptions[0];

      // Determine the correct index robustly across data shapes
      let correctAnswer: number | undefined = undefined;
      if (typeof selectedQuestion.answerIndex === 'number') {
        correctAnswer = Number(selectedQuestion.answerIndex);
        console.log('Breakdown MCQ - using selectedQuestion.answerIndex:', correctAnswer);
      } else if (Array.isArray(selectedQuestion.correct) && selectedQuestion.correct.length > 0) {
        correctAnswer = Number(selectedQuestion.correct[0]);
        console.log('Breakdown MCQ - using selectedQuestion.correct[0]:', correctAnswer);
      } else if (typeof (selectedQuestion as any).answerIdx === 'number') {
        correctAnswer = Number((selectedQuestion as any).answerIdx);
        console.log('Breakdown MCQ - using selectedQuestion.answerIdx:', correctAnswer);
      } else if (Array.isArray(correctAnswersArray) && correctAnswersArray.length > 0) {
        correctAnswer = Number(correctAnswersArray[0]);
        console.log('Breakdown MCQ - using correctAnswersArray[0]:', correctAnswer);
      }

      console.log('Breakdown MCQ - correctAnswersArray:', correctAnswersArray);
      console.log('Breakdown MCQ - resolved correctAnswer:', correctAnswer);

      // Guard if still undefined
      if (correctAnswer === undefined || Number.isNaN(correctAnswer)) {
        console.warn('Breakdown MCQ - correctAnswer is undefined; defaulting to 0');
        correctAnswer = 0;
      }

      // Check if answer is correct (correctAnswer is 0-based)
      const isCorrect = correctAnswer === chosen;
      
      console.log('Breakdown MCQ - chosen:', chosen, 'correctAnswer:', correctAnswer, 'isCorrect:', isCorrect);
      console.log('Breakdown MCQ - selectedQuestion:', selectedQuestion);
      
      const newStates = Array(selectedQuestion.options?.length || 4).fill('neutral') as OptionState[];
      newStates[chosen] = isCorrect ? 'green' : 'red';
      
      // If incorrect, also mark the correct option green
      if (!isCorrect && correctAnswer >= 0 && correctAnswer < newStates.length) {
        newStates[correctAnswer] = 'green';
      }
      
      setOptionStates(newStates);
    } else if (selectedQuestion.type === 'Multiple Answer') {
      if (selectedOptions.length === 0) return;
      
      // For multiple answer questions, check for answerIndices field
      let multiCorrectArray: number[] = [];
      if ('answerIndices' in selectedQuestion && (selectedQuestion as any).answerIndices) {
        multiCorrectArray = (selectedQuestion as any).answerIndices.map((v: any) => Number(v));
        console.log('Using answerIndices field:', multiCorrectArray);
      } else if (correctAnswersArray.length > 0) {
        multiCorrectArray = correctAnswersArray;
        console.log('Using correct field:', multiCorrectArray);
      }
      
      // Normalize correct indices if they appear to be 1-based (defensive)
      const optionsLen = selectedQuestion.options?.length || 4;
      const normalizedCorrect = ((): number[] => {
        if (!multiCorrectArray || multiCorrectArray.length === 0) return [];
        const hasZero = multiCorrectArray.includes(0);
        const min = Math.min(...multiCorrectArray);
        const max = Math.max(...multiCorrectArray);
        const looksOneBased = !hasZero && min >= 1 && max <= optionsLen;
        return looksOneBased ? multiCorrectArray.map(v => v - 1) : multiCorrectArray;
      })();
      console.log('Breakdown Multi - normalizedCorrect:', normalizedCorrect, 'selectedOptions:', selectedOptions);
      const states = evaluateMulti(normalizedCorrect, selectedOptions, optionsLen);
      setOptionStates(states);
    } else if (selectedQuestion.type === 'Numerical') {
      // Numerical validation with range support
      const value = parseFloat(numericValue);
      if (!isNaN(value)) {
        const state = evaluateNumeric(
          correctAnswersArray[0],
          value,
          { min: selectedQuestion.rangeMin, max: selectedQuestion.rangeMax }
        );
        setOptionStates([state]);
      }
    }

    setIsSubmitted(true);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedQuestion(null);
  };

  const handleShowSlides = async () => {
    if (!selectedQuestion || !selectedChapter) {
      console.error('No question or chapter selected for slides');
      return;
    }

    try {
      setSlidesLoading(true);
      console.log('Loading slides for question:', selectedQuestion.id);
      
      const slides = await getSlidesByQuestionId(selectedChapter, selectedQuestion.id);
      console.log('Loaded slides:', slides);
      
      setCurrentSlides(slides);
      setViewMode('slides');
    } catch (error) {
      console.error('Error loading slides:', error);
      // Fallback to empty slides or show error message
      setCurrentSlides([]);
      setViewMode('slides');
    } finally {
      setSlidesLoading(false);
    }
  };

  // Render slide deck view
  if (viewMode === 'slides') {
    if (slidesLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading breakdown slides...</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <SlideDeck 
          slides={currentSlides}
          onBackToQuestion={() => setViewMode('question')} 
        />
      </div>
    );
  }

  // Render individual question view
  if (viewMode === 'question' && selectedQuestion) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Logo />
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-gray-300 hover:border-primary-300"
              >
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </header>

        <div className={styles.container}>
          <div className={styles.mainQuestion}>
            <div className={styles.questionHeader}>
              <div>
                <button
                  onClick={handleBackToList}
                  className="text-primary-600 hover:text-primary-800 mb-2 flex items-center gap-2 text-sm"
                >
                  ← Back to questions
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  <LaTeXRenderer>{selectedQuestion.title}</LaTeXRenderer>
                </h1>
              </div>
              <button
                onClick={handleShowSlides}
                className={styles.breakdownButton}
              >
                Break this down
              </button>
            </div>

                        <div className="mb-6">
              <p className="text-lg text-gray-700 mb-4">
                <LaTeXRenderer>{selectedQuestion.text}</LaTeXRenderer>
              </p>
              
              {selectedQuestion.img && (
                <div className={styles.imageContainer}>
                  <FirebaseImage 
                    imagePath={selectedQuestion.img} 
                    alt="Question diagram"
                    className={styles.slideImage}
                  />
                </div>
              )}
            </div>

            {selectedQuestion.options && selectedQuestion.type !== 'Numerical' && (
              <>
                <div className="space-y-3 mb-6">
                  {selectedQuestion.options.map((option, index) => (
                    <OptionBlock
                      key={index}
                      text={option}
                      state={optionStates[index]}
                      onClick={() => handleOptionClick(index)}
                      isMulti={selectedQuestion.type === 'Multiple Answer'}
                      isSelected={selectedOptions.includes(index)}
                      isSubmitted={isSubmitted}
                    />
                  ))}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={selectedOptions.length === 0 || isSubmitted}
                  className={styles.submitButton}
                >
                  Submit
                </button>
              </>
            )}

            {selectedQuestion.type === 'Numerical' && (
              <>
                <div className="mb-6">
                  <input
                    type="number"
                    value={numericValue}
                    onChange={(e) => setNumericValue(e.target.value)}
                    placeholder="Enter your answer"
                    className={`${styles.numericInput} ${
                      isSubmitted && optionStates[0] ? styles[optionStates[0] as OptionState] : ''
                    }`}
                    disabled={isSubmitted}
                  />
                </div>
                
                <div className={styles.buttonContainer}>
                  <div className={styles.submitSection}>
                    <button
                      onClick={handleSubmit}
                      className={styles.submitButton}
                    >
                      Submit
                    </button>
                  </div>
                  
                  <div className={styles.hintSection}>
                    {/* Hint button space for consistency, even if no hint */}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render main list view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-gray-300 hover:border-primary-300"
            >
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Left Side - Question Cards */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Breakdowns</h1>
            
            {/* Question Cards Grid */}
            {questionsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading breakdown questions...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredQuestions.map((question) => (
                    <BreakdownQuestionCard
                      key={question.id}
                      question={question}
                      onClick={handleQuestionClick}
                    />
                  ))}
                </div>

                {selectedChapter && filteredQuestions.length === 0 && breakdownQuestions.length > 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No questions match the selected filters.</p>
                    <p className="text-sm mt-2">Try adjusting your filter settings.</p>
                  </div>
                )}

                {selectedChapter && breakdownQuestions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No breakdown questions available for this chapter yet.</p>
                  </div>
                )}

                {!selectedChapter && !chaptersLoading && (
                  <div className="text-center py-12 text-gray-500">
                    <p>Select a chapter to view breakdown questions.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Side - Chapter Navigation */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chapters</h2>
              
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {chaptersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading chapters...</span>
                  </div>
                ) : chaptersError ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-500 mb-2">{chaptersError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : firebaseChapters.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No chapters found</p>
                  </div>
                ) : (
                  firebaseChapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterChange(chapter.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedChapter === chapter.id
                          ? 'bg-primary-50 border border-primary-200 text-primary-900'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{chapter.name}</p>
                          <p className="text-sm text-gray-500">
                            {chapter.questionCountBreakdowns || 0} questions
                          </p>
                        </div>
                        {selectedChapter === chapter.id && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Question Type Filter */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Question Type</h3>
                <div className="space-y-3">
                  {(['MCQ', 'Multiple Answer', 'Numerical'] as QuestionType[]).map((type) => (
                    <div key={type} className="flex items-center gap-3">
                      <CircularCheckbox
                        checked={selectedQuestionTypes.has(type)}
                        onChange={() => handleQuestionTypeToggle(type)}
                      />
                      <span className="text-sm text-gray-700 cursor-pointer" onClick={() => handleQuestionTypeToggle(type)}>
                        {type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attempt Status Filter */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Attempt Status</h3>
                <div className="space-y-3">
                  {(['Not Attempted', 'Correct Answer', 'Wrong Answer'] as AttemptStatus[]).map((status) => (
                    <div key={status} className="flex items-center gap-3">
                      <CircularCheckbox
                        checked={selectedAttemptStatuses.has(status)}
                        onChange={() => handleAttemptStatusToggle(status)}
                      />
                      <span className="text-sm text-gray-700 cursor-pointer" onClick={() => handleAttemptStatusToggle(status)}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam Type Filter */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Exam Type</h3>
                <div className="space-y-3">
                  {(['JEE Main', 'JEE Advanced', 'NEET'] as ExamType[]).map((exam) => (
                    <div key={exam} className="flex items-center gap-3">
                      <CircularCheckbox
                        checked={selectedExamTypes.has(exam)}
                        onChange={() => handleExamTypeToggle(exam)}
                      />
                      <span className="text-sm text-gray-700 cursor-pointer" onClick={() => handleExamTypeToggle(exam)}>
                        {exam}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};