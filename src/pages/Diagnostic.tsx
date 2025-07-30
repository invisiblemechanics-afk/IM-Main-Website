import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getRandomDiagnosticQuestions, DiagnosticQuestion } from '../lib/data/questions';
import { getAllTopicsWithURLs } from '../lib/data/topics';

type Answer = {
  questionId: string;
  chosenIdx: number;
  isCorrect: boolean;
  skillTag: string;
  topicId: string;
};

type View = 'intro' | 'question' | 'feedback' | 'results';

export const Diagnostic: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = React.useState<DiagnosticQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = React.useState(false);
  const [questionsError, setQuestionsError] = React.useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answer[]>([]);
  const [selectedChoice, setSelectedChoice] = React.useState<number | null>(null);
  const [view, setView] = React.useState<View>('intro');
  const [showFeedback, setShowFeedback] = React.useState(false);

  useEffect(() => {
    document.title = 'Diagnostic Test - AuthFlow';
  }, []);

  // Load questions when component mounts
  React.useEffect(() => {
    const loadQuestions = async () => {
      setQuestionsLoading(true);
      setQuestionsError(null);
      try {
        const randomQuestions = await getRandomDiagnosticQuestions();
        setQuestions(randomQuestions);
      } catch (error) {
        console.error('Failed to load diagnostic questions:', error);
        setQuestionsError('Failed to load questions. Please try again.');
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  // Redirect unauthenticated users
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const handleStart = () => {
    if (questions.length === 0) {
      setQuestionsError('No questions available. Please try again.');
      return;
    }
    setView('question');
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

    setAnswers(prev => [...prev, newAnswer]);
    setShowFeedback(true);
    setView('feedback');
  };

  const handleNext = () => {
    setSelectedChoice(null);
    setShowFeedback(false);
    
    if (currentIdx + 1 >= questions.length) {
      setView('results');
    } else {
      setCurrentIdx(prev => prev + 1);
      setView('question');
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
      state: { preselected: preselectedIds }
    });
  };

  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const scorePercentage = Math.round((correctAnswers / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Questions Loading State */}
        {view === 'intro' && questionsLoading && (
          <div className="bg-white dark:bg-gray-800/70 rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Loading Questions...
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Fetching 10 random questions from our database
              </p>
            </div>
          </div>
        )}

        {/* Questions Error State */}
        {view === 'intro' && questionsError && (
          <div className="bg-white dark:bg-gray-800/70 rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Error Loading Questions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {questionsError}
              </p>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Normal Intro Screen */}
        {view === 'intro' && !questionsLoading && !questionsError && (
          <div className="bg-white dark:bg-gray-800/70 rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Vector Skills Diagnostic
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                15 quick questions to gauge your Vector skills and create a personalized learning path.
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Takes about 5 minutes
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Immediate feedback on each question
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Personalized learning recommendations
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={questions.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {questions.length === 0 ? 'Loading Questions...' : 'Start Diagnostic'}
            </button>
          </div>
        )}

        {view === 'question' && currentQuestion && (
          <div className="bg-white dark:bg-gray-800/70 rounded-2xl shadow-xl p-8 animate-fade-in">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Question {currentIdx + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                {currentQuestion.stem}
              </h2>

              <div className="space-y-3">
                {currentQuestion.choices.map((choice, index) => (
                  <label
                    key={index}
                    className={`
                      flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${selectedChoice === index
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="choice"
                      value={index}
                      checked={selectedChoice === index}
                      onChange={() => setSelectedChoice(index)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="ml-3 text-gray-900 dark:text-gray-100">
                      {choice}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={selectedChoice === null}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Submit Answer
            </button>
          </div>
        )}

        {view === 'feedback' && (
          <div className="bg-white dark:bg-gray-800/70 rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-6">
              {answers[answers.length - 1]?.isCorrect ? (
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
              
              <div role="alert">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {answers[answers.length - 1]?.isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                
                {!answers[answers.length - 1]?.isCorrect && (
                  <p className="text-gray-600 dark:text-gray-400">
                    The correct answer was: <strong>{currentQuestion.choices[currentQuestion.answerIdx]}</strong>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}

        {view === 'results' && (
          <div className="bg-white dark:bg-gray-800/70 rounded-2xl shadow-xl p-8 text-center animate-fade-in">
            <div className="mb-8">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Diagnostic Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You scored {correctAnswers} out of {questions.length} questions correctly ({scorePercentage}%)
              </p>

              {/* Simple results visualization */}
              <div className="max-w-sm mx-auto mb-8">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Correct: {correctAnswers}</span>
                  <span>Incorrect: {questions.length - correctAnswers}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-green-500 h-4 transition-all duration-500"
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGeneratePlaylist}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              See My Personalized Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};