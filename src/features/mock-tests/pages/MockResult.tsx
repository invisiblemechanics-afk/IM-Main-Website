import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, TrendingUp, Clock, Target, CheckCircle, XCircle, 
  Minus, BarChart3, PieChart, Eye, Award, Download 
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db, auth } from '../../../lib/firebase';
import { LaTeXRenderer } from '../../../components/LaTeXRenderer';
import { LoaderOne } from '../../../components/ui/loader';

type AttemptDoc = {
  testId: string;
  testTitle: string;
  exam: string;
  isViolation?: boolean; // Flag for proctoring violations
  totals: {
    totalQuestions: number;
    attempted: number;
    correct: number;
    incorrect: number;
    partial: number;
    unattempted: number;
    score: number;
    maxScore: number;
    durationSec: number;
  };
  byDifficulty: Record<string, { correct: number; total: number; percent: number }>;
  byChapter: Record<string, { correct: number; total: number; percent: number }>;
  perQuestion: Array<{
    qid: string;
    result: 'correct' | 'incorrect' | 'partial' | 'unattempted';
    score: number;
    timeSec: number;
    difficulty: string;
    type: 'MCQ' | 'MultipleAnswer' | 'Numerical';
    chapter?: string | null;
    chapterId?: string | null;
    skillTags?: string[];
    questionText?: string;
    choices?: string[];
    response?: any;
  }>;
};



export default function MockResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedQuestionData, setSelectedQuestionData] = useState<AttemptDoc['perQuestion'][0] | null>(null);
  const [data, setData] = useState<AttemptDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid || 'anon';
    if (!attemptId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, 'users', uid, 'mockTestAttempts', attemptId))
      .then((snap) => {
        if (snap.exists()) setData(snap.data() as AttemptDoc);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching attempt data:', error);
        setLoading(false);
      });
  }, [attemptId]);

  const accuracy = useMemo(() => {
    if (!data) return 0;
    const den = data.totals.attempted || 1;
    return Math.round((data.totals.correct / den) * 1000) / 10;
  }, [data]);

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'correct':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'incorrect':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'unattempted':
        return <Minus className="w-4 h-4 text-gray-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const openSolutionModal = (questionNumber: number) => {
    setSelectedQuestion(questionNumber);
    setShowSolutionModal(true);
  };

  const openQuestionModal = (questionData: AttemptDoc['perQuestion'][0]) => {
    setSelectedQuestionData(questionData);
    setShowQuestionModal(true);
  };

  const getQuestionPreview = (questionText: string, maxLength: number = 80) => {
    if (!questionText) return 'No question text available';
    
    // Strip LaTeX delimiters for preview (keeping the content readable)
    let cleanText = questionText
      .replace(/\$\$([^$]+)\$\$/g, '$1') // Block math
      .replace(/\$([^$]+)\$/g, '$1'); // Inline math
    
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength).trim() + '...';
  };

  const formatMarks = (result: string, score: number) => {
    if (result === 'unattempted') return 'Unattempted';
    
    const resultText = result.charAt(0).toUpperCase() + result.slice(1);
    const scoreText = score >= 0 ? `+${score}` : `${score}`;
    
    return `${resultText}, ${scoreText}`;
  };

  const formatUserResponse = (questionData: AttemptDoc['perQuestion'][0]) => {
    if (!questionData.response) return 'No response';

    const response = questionData.response;
    
    if (questionData.type === 'MCQ' && response.kind === 'MCQ') {
      if (response.choiceIndex === undefined) return 'No response';
      const choiceLetter = String.fromCharCode(65 + response.choiceIndex); // A, B, C, D
      const choiceText = questionData.choices?.[response.choiceIndex] || '';
      return `(${choiceLetter}) ${choiceText}`;
    }
    
    if (questionData.type === 'MultipleAnswer' && response.kind === 'MultipleAnswer') {
      if (!response.choiceIndices || response.choiceIndices.length === 0) return 'No response';
      const selectedChoices = response.choiceIndices.map(index => {
        const choiceLetter = String.fromCharCode(65 + index);
        const choiceText = questionData.choices?.[index] || '';
        return `(${choiceLetter}) ${choiceText}`;
      });
      return selectedChoices.join(', ');
    }
    
    if (questionData.type === 'Numerical' && response.kind === 'Numerical') {
      if (response.value === undefined || response.value === '') return 'No response';
      return `${response.value}`;
    }
    
    return 'No response';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoaderOne />
          </div>
          <p className="text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Test results not found.</p>
          <button
            onClick={() => navigate('/mock-tests')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Mock Tests
          </button>
        </div>
      </div>
    );
  }

  // Check for proctoring violations
  if (data.isViolation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Test Submission Flagged</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              You are suspected of foul practices during the test due to which you will not be receiving your test analysis.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">
                <strong>Reason:</strong> Proctoring violations detected during the test attempt.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => navigate('/mock-tests')}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Back to Mock Tests
              </button>
              <button
                onClick={() => navigate('/mock-tests/library')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Browse Test Library
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/mock-tests')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
              <p className="text-gray-600">{data?.testTitle || '-'}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
            <button 
              onClick={() => navigate('/mock-tests/library')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take Another Test
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Score</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data?.totals.score ?? 0}</div>
            <div className="text-sm text-gray-600">out of {data?.totals.maxScore ?? 0}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Accuracy</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{accuracy}%</div>
            <div className="text-sm text-gray-600">{data?.totals.correct}/{data?.totals.totalQuestions} correct</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Time Taken</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{Math.floor((data?.totals.durationSec ?? 0) / 60)}m</div>
            <div className="text-sm text-gray-600">{Math.round(((data?.totals.durationSec ?? 0) / Math.max(1, data?.totals.totalQuestions ?? 1)) * 10) / 10}s avg/question</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Questions</span>
            </div>
            <div className="flex space-x-4 text-sm">
              <div className="text-green-600 font-medium">{data?.totals.correct ?? 0} ✓</div>
              <div className="text-red-600 font-medium">{data?.totals.incorrect ?? 0} ✗</div>
              <div className="text-gray-400 font-medium">{data?.totals.unattempted ?? 0} —</div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Difficulty Performance */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Difficulty Performance</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(data?.byDifficulty || {}).map(([difficultyKey, row]) => {
                const percentage = row.total > 0 ? (row.correct / row.total) * 100 : 0;
                const displayName = difficultyKey.charAt(0).toUpperCase() + difficultyKey.slice(1);
                
                // Only show if there are questions of this difficulty
                if (row.total === 0) return null;
                
                return (
                  <div key={difficultyKey}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{displayName}</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(percentage)}`}>
                        {row.correct}/{row.total} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          difficultyKey === 'easy' ? 'bg-green-500' :
                          difficultyKey === 'moderate' ? 'bg-yellow-500' :
                          difficultyKey === 'tough' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </motion.div>

          {/* Topic Performance */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Topic Performance</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(data?.byChapter || {}).map(([topic, row]) => {
                const percentage = (row.correct / Math.max(1, row.total)) * 100;
                return (
                  <div key={topic} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{topic}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{row.correct}/{row.total}</span>
                      <span className={`text-sm font-medium ${getPerformanceColor(percentage)}`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Question Review Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Question Review</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solution</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data?.perQuestion || []).map((pq, i) => (
                  <tr key={pq.qid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          {getQuestionPreview(pq.questionText || '')}
                        </div>
                        <button
                          onClick={() => openQuestionModal(pq)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Full Question
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getResultIcon(pq.result)}
                        <span className={`text-sm font-medium ${
                          pq.result === 'correct' ? 'text-green-600' :
                          pq.result === 'incorrect' ? 'text-red-600' :
                          'text-gray-400'
                        }`}>
                          {pq.result}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.floor(pq.timeSec / 60)}:{(pq.timeSec % 60).toString().padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        (pq.difficulty === 'easy') ? 'bg-green-100 text-green-800' :
                        (pq.difficulty === 'moderate') ? 'bg-yellow-100 text-yellow-800' :
                        (pq.difficulty === 'tough') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pq.difficulty ? pq.difficulty.charAt(0).toUpperCase() + pq.difficulty.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pq.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pq.skillTags && pq.skillTags.length > 0 
                        ? pq.skillTags.join(', ')
                        : pq.chapter || 'Other'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {true ? (
                        <button
                          onClick={() => openSolutionModal(i + 1)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Solution Modal */}
      {showSolutionModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Solution - Question {selectedQuestion}
              </h3>
              <button
                onClick={() => setShowSolutionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* TODO: wire to actual Breakdowns slides UI for that question */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📝 TODO: Integration Needed</h4>
                  <p className="text-blue-800 text-sm">
                    This modal should display the Breakdowns slides UI for question {selectedQuestion}.
                    Read from /{`<chapter>`}-Test-Questions/{`{qid}`}/Slides if available.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Sample Solution Content:</h4>
                  <p className="text-gray-700 mb-4">
                    This is where the detailed solution for Question {selectedQuestion} would appear,
                    using the same slide-based interface as the Breakdowns feature.
                  </p>
                  <div className="space-y-2">
                    <div className="bg-white border rounded p-3">
                      <strong>Step 1:</strong> Understanding the problem
                    </div>
                    <div className="bg-white border rounded p-3">
                      <strong>Step 2:</strong> Applying the concept
                    </div>
                    <div className="bg-white border rounded p-3">
                      <strong>Step 3:</strong> Final calculation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Question Modal */}
      {showQuestionModal && selectedQuestionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Question {(data?.perQuestion.findIndex(q => q.qid === selectedQuestionData.qid) || 0) + 1} - {selectedQuestionData.type}
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                  <div className="text-gray-700">
                    <LaTeXRenderer>{selectedQuestionData.questionText || ''}</LaTeXRenderer>
                  </div>
                </div>
                
                {selectedQuestionData.choices && selectedQuestionData.choices.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
                    <div className="space-y-2">
                      {selectedQuestionData.choices.map((choice, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <span className="font-medium text-gray-600 min-w-[20px]">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <div className="text-gray-700">
                            <LaTeXRenderer>{choice}</LaTeXRenderer>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Your Answer:</h4>
                  <div className="text-yellow-800">
                    <LaTeXRenderer>{formatUserResponse(selectedQuestionData)}</LaTeXRenderer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-1">Your Result:</h4>
                    <span className={`text-sm font-medium ${
                      selectedQuestionData.result === 'correct' ? 'text-green-600' :
                      selectedQuestionData.result === 'incorrect' ? 'text-red-600' :
                      selectedQuestionData.result === 'partial' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {formatMarks(selectedQuestionData.result, selectedQuestionData.score)}
                    </span>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-1">Time Spent:</h4>
                    <span className="text-sm font-medium text-purple-700">
                      {Math.floor(selectedQuestionData.timeSec / 60)}:{(selectedQuestionData.timeSec % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
