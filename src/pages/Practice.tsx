import React, { useState, useMemo, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllChapters } from '../lib/data/questions';
import { Logo } from '../components/Logo';
import { CircularCheckbox } from '../components/CircularCheckbox';
import { LoaderOne } from '../components/ui/loader';
import { BreakdownQuestionCard } from '../components/breakdowns/BreakdownQuestionCard';
import { SlideDeck } from '../components/breakdowns/SlideDeck';
import { OptionBlock } from '../components/breakdowns/OptionBlock';
import { FirebaseImage } from '../components/breakdowns/FirebaseImage';
import { evaluateMulti, evaluateNumeric } from '../components/breakdowns/utils';
import { OptionState, Slide } from '../components/breakdowns/types';
import { LaTeXRenderer } from '../components/LaTeXRenderer';
import { 
  getPracticeQuestionsByChapter, 
  getPracticeQuestionById, 
  getAnswerSlidesByQuestionId,
  PracticeQuestion 
} from '../lib/data/questions';
import styles from '../components/breakdowns/breakdowns.module.css';

type ViewMode = 'list' | 'question' | 'answer-slides';
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

export const Practice: React.FC = () => {
  const { user, loading } = useAuth();
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    document.title = 'Practice Problems - Invisible Mechanics';
  }, []);
  const [selectedQuestion, setSelectedQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [optionStates, setOptionStates] = useState<OptionState[]>([]);
  const [numericValue, setNumericValue] = useState<string>('');
  
  // Firebase chapters state
  const [firebaseChapters, setFirebaseChapters] = useState<FirebaseChapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  
  // Practice questions state
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  
  // Answer slides state for SlideDeck
  const [currentAnswerSlides, setCurrentAnswerSlides] = useState<Slide[]>([]);
  const [answerSlidesLoading, setAnswerSlidesLoading] = useState(false);
  
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
        console.log('Loading chapters from Firebase for Practice page...');
        
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

  // Load practice questions when selected chapter changes
  useEffect(() => {
    const loadPracticeQuestions = async () => {
      if (!selectedChapter) {
        setPracticeQuestions([]);
        return;
      }

      try {
        setQuestionsLoading(true);
        console.log('Loading practice questions for chapter:', selectedChapter);
        
        const questions = await getPracticeQuestionsByChapter(selectedChapter);
        console.log('Loaded practice questions:', questions);
        
        setPracticeQuestions(questions);
      } catch (error) {
        console.error('Error loading practice questions:', error);
        setPracticeQuestions([]);
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadPracticeQuestions();
  }, [selectedChapter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return practiceQuestions.filter(question => {
      const typeMatch = selectedQuestionTypes.has(question.type);
      const statusMatch = selectedAttemptStatuses.has(question.status);
      const examMatch = selectedExamTypes.has(question.exam);
      return typeMatch && statusMatch && examMatch;
    });
  }, [practiceQuestions, selectedQuestionTypes, selectedAttemptStatuses, selectedExamTypes]);

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
    setCurrentAnswerSlides([]);
  };

  const handleQuestionClick = async (questionId: string) => {
    try {
      const question = await getPracticeQuestionById(questionId, selectedChapter);
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
      console.error('Error loading question:', error);
    }
  };

  const handleCheckAnswer = async () => {
    console.log('Check Answer button clicked!');
    console.log('Selected Question:', selectedQuestion);
    console.log('Selected Chapter:', selectedChapter);
    console.log('Question ID being used:', selectedQuestion?.id);
    
    if (!selectedQuestion || !selectedChapter) {
      console.error('Missing selectedQuestion or selectedChapter');
      return;
    }
    
    try {
      setAnswerSlidesLoading(true);
      console.log('Calling getAnswerSlidesByQuestionId with:', selectedChapter, selectedQuestion.id);
      const slides = await getAnswerSlidesByQuestionId(selectedChapter, selectedQuestion.id);
      console.log('Received slides from function:', slides);
      setCurrentAnswerSlides(slides);
      setViewMode('answer-slides');
    } catch (error) {
      console.error('Error loading answer slides:', error);
    } finally {
      setAnswerSlidesLoading(false);
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
    console.log('Practice handleSubmit - selectedQuestion.correct:', selectedQuestion.correct);
    console.log('Practice handleSubmit - selectedOptions:', selectedOptions);

    // Normalize correct answers to numbers
    // Also check for 'answerIndex' field as a fallback
    let correctValue = selectedQuestion.correct;
    if ((correctValue === undefined || correctValue === null) && selectedQuestion.answerIndex !== undefined) {
      correctValue = selectedQuestion.answerIndex;
      console.log('Practice - Using answerIndex field:', correctValue);
    }
    
    const correctAnswersArray: number[] = Array.isArray(correctValue)
      ? correctValue.map((c: any) => Number(c))
      : [Number(correctValue ?? 0)];

    console.log('Practice handleSubmit - correctAnswersArray:', correctAnswersArray);

    if (selectedQuestion.type === 'MCQ') {
      // Single correct
      if (selectedOptions.length === 0) return;
      const chosen = selectedOptions[0];
      const correctAnswer = correctAnswersArray[0];
      
      // Check if answer is correct
      // The correctAnswer should already be 0-based from validateQuestionData
      const isCorrect = correctAnswer === chosen;
      
      console.log('Practice MCQ - chosen:', chosen, 'correctAnswer:', correctAnswer, 'isCorrect:', isCorrect);
      
      const newStates = Array(selectedQuestion.options?.length || 4).fill('neutral') as OptionState[];
      newStates[chosen] = isCorrect ? 'green' : 'red';
      
            // If incorrect, also mark the correct option green
      if (!isCorrect && correctAnswer >= 0 && correctAnswer < newStates.length) {
        newStates[correctAnswer] = 'green';
      }
      
      setOptionStates(newStates);
    } else if (selectedQuestion.type === 'Multiple Answer') {
      // For multiple answer questions, check for answerIndices field
      let multiCorrectArray: number[] = [];
      if ('answerIndices' in selectedQuestion && (selectedQuestion as any).answerIndices) {
        multiCorrectArray = (selectedQuestion as any).answerIndices.map((v: any) => Number(v));
        console.log('Practice - Using answerIndices field:', multiCorrectArray);
      } else if (correctAnswersArray.length > 0) {
        multiCorrectArray = correctAnswersArray;
        console.log('Practice - Using correct field:', multiCorrectArray);
      }
      
      // Multiple correct - normalize to 0-based if needed
      const normalizedCorrect = multiCorrectArray.map((v) => {
        // If value is 1-based (1 to options.length), convert to 0-based
        if (v > 0 && v <= (selectedQuestion.options?.length || 4)) {
          return v - 1;
        }
        return v;
      });
      console.log('Practice Multi - normalizedCorrect:', normalizedCorrect, 'selectedOptions:', selectedOptions);
      const states = evaluateMulti(normalizedCorrect, selectedOptions, selectedQuestion.options?.length || 4);
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



  // Render answer slides view
  if (viewMode === 'answer-slides') {
    return (
      <div className={styles.container}>
        <SlideDeck 
          slides={currentAnswerSlides}
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

                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={handleSubmit}
                    disabled={selectedOptions.length === 0 || isSubmitted}
                    className={styles.submitButton}
                  >
                    Submit
                  </button>
                  
                  <button
                    onClick={handleCheckAnswer}
                    disabled={answerSlidesLoading}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {answerSlidesLoading ? 'Loading...' : 'Check the Answer'}
                  </button>
                </div>
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
                
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={handleSubmit}
                    disabled={!numericValue.trim() || isSubmitted}
                    className={styles.submitButton}
                  >
                    Submit
                  </button>
                  
                  <button
                    onClick={handleCheckAnswer}
                    disabled={answerSlidesLoading}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {answerSlidesLoading ? 'Loading...' : 'Check the Answer'}
                  </button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Practice Problems</h1>
            
            {/* Question Cards Grid */}
            {questionsLoading ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <LoaderOne />
                </div>
                <p className="text-gray-500">Loading practice questions...</p>
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

                {selectedChapter && filteredQuestions.length === 0 && practiceQuestions.length > 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No questions match the selected filters.</p>
                    <p className="text-sm mt-2">Try adjusting your filter settings.</p>
                  </div>
                )}

                {selectedChapter && practiceQuestions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No practice questions available for this chapter yet.</p>
                  </div>
                )}

                {!selectedChapter && !chaptersLoading && (
                  <div className="text-center py-12 text-gray-500">
                    <p>Select a chapter to view practice questions.</p>
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
                    <LoaderOne />
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
                            {chapter.questionCountPractice || 0} questions
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