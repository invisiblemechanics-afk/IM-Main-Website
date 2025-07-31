import React, { useState, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { CircularCheckbox } from '../components/CircularCheckbox';
import { BreakdownQuestionCard } from '../components/breakdowns/BreakdownQuestionCard';
import { SlideDeck } from '../components/breakdowns/SlideDeck';
import { OptionBlock } from '../components/breakdowns/OptionBlock';
import { FirebaseImage } from '../components/breakdowns/FirebaseImage';
import { evaluateMulti } from '../components/breakdowns/utils';
import { OptionState } from '../components/breakdowns/types';
import { 
  chapters, 
  breakdownQuestions, 
  getQuestionsByChapter, 
  getQuestionById, 
  BreakdownQuestion 
} from '../lib/data/breakdownQuestions';
import styles from '../components/breakdowns/breakdowns.module.css';

type ViewMode = 'list' | 'question' | 'slides';
type QuestionType = 'MCQ' | 'Multiple Answer' | 'Numerical';
type AttemptStatus = 'Not Attempted' | 'Correct Answer' | 'Wrong Answer';

export const Breakdowns: React.FC = () => {
  const { user, loading } = useAuth();
  const [selectedChapter, setSelectedChapter] = useState('vectors');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedQuestion, setSelectedQuestion] = useState<BreakdownQuestion | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [optionStates, setOptionStates] = useState<OptionState[]>([]);
  
  // Filter states
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<Set<QuestionType>>(new Set(['MCQ', 'Multiple Answer', 'Numerical']));
  const [selectedAttemptStatuses, setSelectedAttemptStatuses] = useState<Set<AttemptStatus>>(new Set(['Not Attempted', 'Correct Answer', 'Wrong Answer']));

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
    return getQuestionsByChapter(selectedChapter).filter(question => {
      const typeMatch = selectedQuestionTypes.has(question.type);
      const statusMatch = selectedAttemptStatuses.has(question.status);
      return typeMatch && statusMatch;
    });
  }, [selectedChapter, selectedQuestionTypes, selectedAttemptStatuses]);

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

  const handleQuestionClick = (questionId: string) => {
    const question = getQuestionById(questionId);
    if (question) {
      setSelectedQuestion(question);
      setViewMode('question');
      setSelectedOptions([]);
      setIsSubmitted(false);
      if (question.options) {
        setOptionStates(Array(question.options.length).fill('neutral'));
      }
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
    if (!selectedQuestion || !selectedQuestion.correct) return;
    
    const correctAnswers = Array.isArray(selectedQuestion.correct) 
      ? selectedQuestion.correct 
      : [selectedQuestion.correct];
    
    const states = evaluateMulti(correctAnswers, selectedOptions);
    setOptionStates(states);
    setIsSubmitted(true);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedQuestion(null);
  };

  const handleShowSlides = () => {
    setViewMode('slides');
  };

  // Render slide deck view
  if (viewMode === 'slides') {
    return (
      <div className={styles.container}>
        <SlideDeck onBackToQuestion={() => setViewMode('question')} />
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
                <h1 className="text-2xl font-bold text-gray-900">{selectedQuestion.title}</h1>
              </div>
              <button
                onClick={handleShowSlides}
                className={styles.breakdownButton}
              >
                Break this down
              </button>
            </div>

            <div className="mb-6">
              <p className="text-lg text-gray-700 mb-4">{selectedQuestion.text}</p>
              
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

            {selectedQuestion.options && (
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
                    placeholder="Enter your answer"
                    className={styles.numericInput}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredQuestions.map((question) => (
                <BreakdownQuestionCard
                  key={question.id}
                  question={question}
                  onClick={handleQuestionClick}
                />
              ))}
            </div>

            {filteredQuestions.length === 0 && getQuestionsByChapter(selectedChapter).length > 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No questions match the selected filters.</p>
                <p className="text-sm mt-2">Try adjusting your filter settings.</p>
              </div>
            )}

            {getQuestionsByChapter(selectedChapter).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No breakdown questions available for this chapter yet.</p>
              </div>
            )}
          </div>

          {/* Right Side - Chapter Navigation */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chapters</h2>
              
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedChapter === chapter.id
                        ? 'bg-primary-50 border border-primary-200 text-primary-900'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{chapter.name}</p>
                        <p className="text-sm text-gray-500">{chapter.questionCount} questions</p>
                      </div>
                      {selectedChapter === chapter.id && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};