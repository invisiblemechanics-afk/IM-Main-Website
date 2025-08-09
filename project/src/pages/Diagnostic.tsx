import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getRandomDiagnosticQuestions, DiagnosticQuestion, getAllChapters, Chapter } from '../lib/data/questions';
import { getAllTopicsWithURLs } from '../lib/data/topics';
import { CircularCheckbox } from '../components/CircularCheckbox';
import { OptionState } from '../components/breakdowns/types';

type Answer = {
  questionId: string;
  chosenIdx: number;
  isCorrect: boolean;
  skillTag: string;
  topicId: string;
};

type View = 'chapterSelection' | 'intro' | 'question' | 'feedback' | 'results';

export const Diagnostic: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [chapters, setChapters] = React.useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = React.useState(true);
  const [chaptersError, setChaptersError] = React.useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = React.useState<Chapter | null>(null);
  const [questions, setQuestions] = React.useState<DiagnosticQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = React.useState(false);
  const [questionsError, setQuestionsError] = React.useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answer[]>([]);
  const [selectedChoice, setSelectedChoice] = React.useState<number | null>(null);
  const [view, setView] = React.useState<View>('chapterSelection');
  const [showFeedback, setShowFeedback] = React.useState(false);
  const [optionStates, setOptionStates] = React.useState<OptionState[]>([]);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  useEffect(() => {
    document.title = 'Diagnostic Test - Invisible Mechanics';
  }, []);

  // Load chapters when component mounts
  React.useEffect(() => {
    const loadChapters = async () => {
      setChaptersLoading(true);
      setChaptersError(null);
      try {
        const availableChapters = await getAllChapters();
        setChapters(availableChapters);
      } catch (error) {
        console.error('Failed to load chapters:', error);
        setChaptersError('Failed to load chapters. Please try again.');
      } finally {
        setChaptersLoading(false);
      }
    };

    loadChapters();
  }, []);

  // Load questions when a chapter is selected
  React.useEffect(() => {
    if (!selectedChapter) return;
    
    const loadQuestions = async () => {
      setQuestionsLoading(true);
      setQuestionsError(null);
      try {
        const randomQuestions = await getRandomDiagnosticQuestions(selectedChapter.id);
        setQuestions(randomQuestions);
      } catch (error) {
        console.error('Failed to load diagnostic questions:', error);
        setQuestionsError('Failed to load questions. Please try again.');
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadQuestions();
  }, [selectedChapter]);

  // Redirect unauthenticated users
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

  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setView('intro');
  };

  const handleStart = () => {
    if (questions.length === 0) {
      setQuestionsError('No questions available. Please try again.');
      return;
    }
    setView('question');
    // Initialize option states for first question
    if (questions[0]) {
      setOptionStates(Array(questions[0].choices.length).fill('neutral'));
    }
  };

  const handleSubmit = () => {
    if (selectedChoice === null) return;

    const isCorrect = selectedChoice === currentQuestion.answerIdx;
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      chosenIdx: selectedChoice,
      isCorrect,
      skillTag: currentQuestion.skillTag,
      topicId: currentQuestion.topicId
    };

    // Apply color-coded feedback
    const newStates = Array(currentQuestion.choices.length).fill('neutral') as OptionState[];
    newStates[selectedChoice] = isCorrect ? 'green' : 'red';
    // Show the correct answer in green if user was wrong
    if (!isCorrect) {
      newStates[currentQuestion.answerIdx] = 'green';
    }
    setOptionStates(newStates);
    setIsSubmitted(true);

    setAnswers(prev => [...prev, newAnswer]);
    setShowFeedback(true);
    setView('feedback');
  };

  const handleNext = () => {
    setSelectedChoice(null);
    setShowFeedback(false);
    setIsSubmitted(false);
    
    if (currentIdx + 1 >= questions.length) {
      setView('results');
    } else {
      setCurrentIdx(prev => prev + 1);
      setView('question');
      // Reset option states for new question
      if (questions[currentIdx + 1]) {
        setOptionStates(Array(questions[currentIdx + 1].choices.length).fill('neutral'));
      }
    }
  };

  const handleGeneratePlaylist = () => {
    // First try using topicId
    const wrongTopicIds = [...new Set(answers
      .filter(answer => !answer.isCorrect)
      .map(answer => answer.topicId)
    )];

    // If topicId is empty/undefined, fall back to skillTag
    const wrongSkillTags = [...new Set(answers
      .filter(answer => !answer.isCorrect)
      .map(answer => answer.skillTag)
    )];

    // Use topicIds if available, otherwise use skillTags
    const preselectedIds = wrongTopicIds.filter(Boolean).length > 0 ? wrongTopicIds : wrongSkillTags;

    navigate('/builder/manual', {
      state: { 
        preselected: preselectedIds,
        selectedChapter: selectedChapter?.id || 'Vectors' // Pass the selected chapter
      }
    });
  };

  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const scorePercentage = Math.round((correctAnswers / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Chapter Selection Screen */}
        {view === 'chapterSelection' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            {chaptersLoading ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary-600/20 rounded-full flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Loading Chapters...
                </h1>
                <p className="text-gray-600">
                  Fetching available subjects for your diagnostic test
                </p>
              </div>
            ) : chaptersError ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Error Loading Chapters
                </h1>
                <p className="text-gray-600 mb-6">
                  {chaptersError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto bg-primary-600/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Choose Your Subject
                  </h1>
                  <p className="text-gray-600">
                    Select the subject you'd like to take a diagnostic test for
                  </p>
                </div>

                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterSelect(chapter)}
                      className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-700">
                            {chapter.name}
                          </h3>
                          {chapter.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transform group-hover:translate-x-1 transition-all duration-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Questions Loading State */}
        {view === 'intro' && questionsLoading && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-primary-600/20 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Loading Questions...
              </h1>
              <p className="text-gray-600">
                Fetching 10 random questions from our database
              </p>
            </div>
          </div>
        )}

        {/* Questions Error State */}
        {view === 'intro' && questionsError && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Error Loading Questions
              </h1>
              <p className="text-gray-600 mb-6">
                {questionsError}
              </p>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Normal Intro Screen */}
        {view === 'intro' && !questionsLoading && !questionsError && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-primary-600/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedChapter?.name} Skills Diagnostic
              </h1>
              <p className="text-gray-600">
                15 quick questions to gauge your {selectedChapter?.name} skills and create a personalized learning path.
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Takes about 5 minutes
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Immediate feedback on each question
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Personalized learning recommendations
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleStart}
                disabled={questions.length === 0}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {questions.length === 0 ? 'Loading Questions...' : 'Start Diagnostic'}
              </button>
              
              <button
                onClick={() => setView('chapterSelection')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                ← Choose Different Subject
              </button>
            </div>
          </div>
        )}

        {view === 'question' && currentQuestion && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentIdx + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                {currentQuestion.stem}
              </h2>

              <div className="space-y-3">
                {currentQuestion.choices.map((choice, index) => {
                  const state = optionStates[index] || 'neutral';
                  const getColorClasses = () => {
                    if (isSubmitted) {
                      switch (state) {
                        case 'green':
                          return 'border-green-500 bg-green-50';
                        case 'red':
                          return 'border-red-500 bg-red-50';
                        case 'yellow':
                          return 'border-yellow-500 bg-yellow-50';
                        case 'purple':
                          return 'border-purple-500 bg-purple-50';
                        default:
                          return 'border-gray-200 bg-white';
                      }
                    }
                    return selectedChoice === index
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300';
                  };

                  return (
                    <label
                      key={index}
                      className={`
                        flex items-center p-4 rounded-lg border-2 transition-all duration-200
                        ${getColorClasses()}
                        ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}
                      `}
                      onClick={() => !isSubmitted && setSelectedChoice(index)}
                    >
                      <CircularCheckbox
                        checked={selectedChoice === index}
                        onChange={() => !isSubmitted && setSelectedChoice(index)}
                      />
                      <span className="ml-3 text-gray-900">
                        {choice}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={selectedChoice === null || isSubmitted}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isSubmitted ? 'Answer Submitted' : 'Submit Answer'}
            </button>
          </div>
        )}

        {view === 'feedback' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              {answers[answers.length - 1]?.isCorrect ? (
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
              
              <div role="alert">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {answers[answers.length - 1]?.isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                
                {!answers[answers.length - 1]?.isCorrect && (
                  <p className="text-gray-600">
                    The correct answer was: <strong>{currentQuestion.choices[currentQuestion.answerIdx]}</strong>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}

        {view === 'results' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-8">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Diagnostic Complete!
              </h2>
              <p className="text-gray-600 mb-6">
                You scored {correctAnswers} out of {questions.length} questions correctly ({scorePercentage}%)
              </p>

              {/* Simple results visualization */}
              <div className="max-w-sm mx-auto mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Correct: {correctAnswers}</span>
                  <span>Incorrect: {questions.length - correctAnswers}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-green-500 h-4 transition-all duration-500"
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGeneratePlaylist}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              See My Personalized Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};