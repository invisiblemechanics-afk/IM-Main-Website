import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, TrendingUp, Clock, Target, CheckCircle, XCircle, 
  Minus, BarChart3, PieChart, Eye, Award, Download 
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db, auth } from '@/lib/firebase';
import { LaTeXRenderer } from '@/components/LaTeXRenderer';
import { LoaderOne } from '@/components/ui/loader';

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
  const [questionDetails, setQuestionDetails] = useState<any>(null);
  const [loadingQuestionDetails, setLoadingQuestionDetails] = useState(false);

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

  const fetchQuestionDetails = async (questionData: AttemptDoc['perQuestion'][0]) => {
    try {
      setLoadingQuestionDetails(true);
      
      // First, get the test data to find the question details
      const testRef = doc(db, 'Tests', data?.testId || '');
      const testSnap = await getDoc(testRef);
      
      if (!testSnap.exists()) {
        console.warn('Test not found');
        return null;
      }
      
      // Get the question from Tests/{testId}/Questions/{questionId}
      const questionRef = doc(testRef, 'Questions', questionData.qid);
      const questionSnap = await getDoc(questionRef);
      
      if (!questionSnap.exists()) {
        console.warn('Question not found in test');
        return null;
      }
      
      const testQuestionData = questionSnap.data();
      console.log('Test question data:', testQuestionData);
      
      // Now get the actual question content from Chapters/{chapterId}-Test-Questions/{questionId}
      if (testQuestionData.chapterId && testQuestionData.questionId) {
        const chapter = testQuestionData.chapterId;
        const qid = testQuestionData.questionId;
        const collName = `${chapter}-Test-Questions`;
        const chapterRef = doc(db, 'Chapters', chapter, collName, qid);
        
        console.log(`Fetching question content from: Chapters/${chapter}/${collName}/${qid}`);
        
        const chapterSnap = await getDoc(chapterRef);
        if (chapterSnap.exists()) {
          const chapterData = chapterSnap.data();
          console.log('Fetched question content:', chapterData);
          
          // Merge test metadata with chapter content
          return {
            ...testQuestionData,
            ...chapterData,
            difficultyBand: testQuestionData.difficultyBand,
            skillTags: testQuestionData.skillTags
          };
        }
      }
      
      // Fallback to test question data if chapter data not found
      return testQuestionData;
    } catch (error) {
      console.error('Error fetching question details:', error);
      return null;
    } finally {
      setLoadingQuestionDetails(false);
    }
  };

  const openQuestionModal = async (questionData: AttemptDoc['perQuestion'][0]) => {
    setSelectedQuestionData(questionData);
    setShowQuestionModal(true);
    setQuestionDetails(null);
    
    // Fetch actual question details from Firestore
    const details = await fetchQuestionDetails(questionData);
    setQuestionDetails(details);
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

  const isOptionCorrect = (index: number, questionDetails: any, questionData: AttemptDoc['perQuestion'][0]) => {
    // Check if this option index is in the correct answer(s)
    if (questionData.type === 'MCQ') {
      // For MCQ, check answerIndex or answerIndices
      if (typeof questionDetails?.answerIndex === 'number') {
        return index === questionDetails.answerIndex;
      }
      if (typeof questionDetails?.correct === 'number') {
        return index === questionDetails.correct;
      }
      if (Array.isArray(questionDetails?.answerIndices) && questionDetails.answerIndices.length > 0) {
        return questionDetails.answerIndices.includes(index);
      }
      if (Array.isArray(questionDetails?.correct) && questionDetails.correct.length > 0) {
        return questionDetails.correct.includes(index);
      }
    } else if (questionData.type === 'MultipleAnswer') {
      // For MultipleAnswer, check answerIndices array
      if (Array.isArray(questionDetails?.answerIndices)) {
        return questionDetails.answerIndices.includes(index);
      }
      if (Array.isArray(questionDetails?.correct)) {
        return questionDetails.correct.includes(index);
      }
    }
    
    return false;
  };

  const formatUserResponseFromFirestore = (questionData: AttemptDoc['perQuestion'][0], questionDetails: any) => {
    if (!questionData.response) return 'No response';

    const response = questionData.response;
    const choices = questionDetails?.choices || [];
    
    // Helper function to get choice text by index
    const getChoiceByIndex = (index: number): string => {
      if (index < 0 || index >= choices.length) return `Option ${String.fromCharCode(65 + index)}`;
      const choice = choices[index];
      return typeof choice === 'string' ? choice : (choice?.text || choice?.content || `Option ${String.fromCharCode(65 + index)}`);
    };

    // Handle different response formats
    if (questionData.type === 'MCQ') {
      // For MCQ, response could be a number (index) or an object
      let choiceIndex: number;
      
      if (typeof response === 'number') {
        choiceIndex = response;
      } else if (response && typeof response === 'object' && 'choiceIndex' in response) {
        choiceIndex = response.choiceIndex;
      } else if (response && typeof response === 'object' && response.kind === 'MCQ' && 'choiceIndex' in response) {
        choiceIndex = response.choiceIndex;
      } else {
        return 'Invalid response format';
      }
      
      if (choiceIndex === undefined || choiceIndex === null) return 'No response';
      
      const choiceLetter = String.fromCharCode(65 + choiceIndex);
      const choiceText = getChoiceByIndex(choiceIndex);
      return `(${choiceLetter}) ${choiceText}`;
    }
    
    if (questionData.type === 'MultipleAnswer') {
      // For MultipleAnswer, response could be an array or an object with choiceIndices
      let choiceIndices: number[] = [];
      
      if (Array.isArray(response)) {
        choiceIndices = response;
      } else if (response && typeof response === 'object' && 'choiceIndices' in response && Array.isArray(response.choiceIndices)) {
        choiceIndices = response.choiceIndices;
      } else if (response && typeof response === 'object' && response.kind === 'MultipleAnswer' && Array.isArray(response.choiceIndices)) {
        choiceIndices = response.choiceIndices;
      }
      
      if (choiceIndices.length === 0) return 'No response';
      
      const selectedChoices = choiceIndices.map(index => {
        const choiceLetter = String.fromCharCode(65 + index);
        const choiceText = getChoiceByIndex(index);
        return `(${choiceLetter}) ${choiceText}`;
      });
      
      return selectedChoices.join(', ');
    }
    
    if (questionData.type === 'Numerical') {
      // For Numerical, response could be a string/number or an object with value
      if (typeof response === 'string' || typeof response === 'number') {
        return String(response);
      } else if (response && typeof response === 'object' && 'value' in response) {
        return String(response.value);
      } else if (response && typeof response === 'object' && response.kind === 'Numerical' && 'value' in response) {
        return String(response.value);
      }
    }
    
    // Fallback for any other format
    return String(response);
  };

  const formatUserResponse = (questionData: AttemptDoc['perQuestion'][0]) => {
    if (!questionData.response) return 'No response';

    const response = questionData.response;
    
    // Helper function to extract text from choice (handle both string and object formats)
    const getChoiceText = (choice: any): string => {
      if (typeof choice === 'string') return choice;
      if (choice?.text && choice.text.trim()) return choice.text;
      if (choice?.content && choice.content.trim()) return choice.content;
      if (choice?.label && choice.label.trim()) return choice.label;
      
      // If text is empty but we have an index, try to find the actual text from the original question data
      // For now, return a placeholder indicating the choice index
      if (typeof choice?.index === 'number') {
        return `Option ${String.fromCharCode(65 + choice.index)}`;
      }
      
      return `[Choice data: ${JSON.stringify(choice)}]`;
    };
    
    if (questionData.type === 'MCQ' && response.kind === 'MCQ') {
      if (response.choiceIndex === undefined) return 'No response';
      const choiceLetter = String.fromCharCode(65 + response.choiceIndex); // A, B, C, D
      const choice = questionData.choices?.[response.choiceIndex];
      const choiceText = choice ? getChoiceText(choice) : '';
      return `(${choiceLetter}) ${choiceText}`;
    }
    
    if (questionData.type === 'MultipleAnswer' && response.kind === 'MultipleAnswer') {
      if (!response.choiceIndices || response.choiceIndices.length === 0) return 'No response';
      const selectedChoices = response.choiceIndices.map(index => {
        const choiceLetter = String.fromCharCode(65 + index);
        const choice = questionData.choices?.[index];
        const choiceText = choice ? getChoiceText(choice) : '';
        return `(${choiceLetter}) ${choiceText}`;
      });
      return selectedChoices.join(', ');
    }
    
    if (questionData.type === 'Numerical' && response.kind === 'Numerical') {
      if (response.value === undefined || response.value === '') return 'No response';
      return `${response.value}`;
    }
    
    // Fallback: try to handle any response format
    if (typeof response === 'string' || typeof response === 'number') {
      return String(response);
    }
    
    // If response structure doesn't match expected format, try to extract meaningful info
    if (response && typeof response === 'object') {
      // Handle array responses (multiple choice)
      if (Array.isArray(response)) {
        return response.map(idx => {
          if (typeof idx === 'number' && questionData.choices?.[idx]) {
            const choiceLetter = String.fromCharCode(65 + idx);
            const choice = questionData.choices[idx];
            const choiceText = getChoiceText(choice);
            return `(${choiceLetter}) ${choiceText}`;
          }
          return String(idx);
        }).join(', ');
      }
      
      // Handle single choice responses
      if ('choiceIndex' in response && typeof response.choiceIndex === 'number') {
        const choiceLetter = String.fromCharCode(65 + response.choiceIndex);
        const choice = questionData.choices?.[response.choiceIndex];
        const choiceText = choice ? getChoiceText(choice) : '';
        return `(${choiceLetter}) ${choiceText}`;
      }
      
      // Handle multiple choice responses
      if ('choiceIndices' in response && Array.isArray(response.choiceIndices)) {
        return response.choiceIndices.map(index => {
          const choiceLetter = String.fromCharCode(65 + index);
          const choice = questionData.choices?.[index];
          const choiceText = choice ? getChoiceText(choice) : '';
          return `(${choiceLetter}) ${choiceText}`;
        }).join(', ');
      }
      
      // Handle value responses
      if ('value' in response) {
        return String(response.value);
      }
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
  console.log('MockResult - checking violation flag:', { 
    isViolation: data.isViolation, 
    isViolationType: typeof data.isViolation,
    attemptId 
  });
  
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
                {loadingQuestionDetails && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-blue-800">Loading question details...</span>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                  <div className="text-gray-700">
                    <LaTeXRenderer>
                      {questionDetails?.questionText || questionDetails?.text || selectedQuestionData.questionText || 'Question text not available'}
                    </LaTeXRenderer>
                  </div>
                </div>
                
                {/* Show options for MCQ/MultipleAnswer or correct answer for Numerical */}
                {selectedQuestionData.type === 'Numerical' ? (
                  /* For Numerical questions, show the correct answer */
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Correct Answer:</h4>
                    <div className="text-green-800 font-medium">
                      <LaTeXRenderer>
                        {(() => {
                          // Try different possible field names for numerical answers
                          const correctAnswer = questionDetails?.correctAnswer || 
                                              questionDetails?.answer || 
                                              questionDetails?.value ||
                                              questionDetails?.correctValue ||
                                              questionDetails?.answerValue ||
                                              questionDetails?.range?.min ||
                                              questionDetails?.range?.max;
                          
                          // If we have a range, display it properly
                          if (questionDetails?.range && questionDetails.range.min !== undefined && questionDetails.range.max !== undefined) {
                            if (questionDetails.range.min === questionDetails.range.max) {
                              return String(questionDetails.range.min);
                            } else {
                              return `${questionDetails.range.min} to ${questionDetails.range.max}`;
                            }
                          }
                          
                          // If we have a single correct value
                          if (correctAnswer !== undefined && correctAnswer !== null && correctAnswer !== '') {
                            return String(correctAnswer);
                          }
                          
                          // Debug: show all available fields to help identify the correct field name
                          console.log('🔍 Numerical question fields:', questionDetails);
                          
                          return 'Correct answer not available';
                        })()}
                      </LaTeXRenderer>
                    </div>
                  </div>
                ) : (
                  /* For MCQ/MultipleAnswer, show options with correct ones highlighted */
                  ((questionDetails?.choices && Array.isArray(questionDetails.choices) && questionDetails.choices.length > 0) || 
                    (selectedQuestionData.choices && selectedQuestionData.choices.length > 0)) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Options:</h4>
                      <div className="space-y-2">
                        {/* Use fetched choices if available, otherwise fall back to stored choices */}
                        {(questionDetails?.choices || selectedQuestionData.choices || []).map((choice: any, index: number) => {
                          // Check if this option is correct
                          const isCorrect = isOptionCorrect(index, questionDetails, selectedQuestionData);
                          
                          return (
                            <div 
                              key={index} 
                              className={`flex items-start space-x-3 p-2 rounded ${
                                isCorrect 
                                  ? 'bg-green-100 border border-green-300' 
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <span className={`font-medium min-w-[20px] ${
                                isCorrect ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <div className={isCorrect ? 'text-green-800' : 'text-gray-700'}>
                                <LaTeXRenderer>
                                  {typeof choice === 'string' ? choice : (choice?.text || choice?.content || `Option ${String.fromCharCode(65 + index)}`)}
                                </LaTeXRenderer>
                              </div>
                              {isCorrect && (
                                <span className="ml-auto text-green-600 text-sm font-medium">✓ Correct</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Your Answer:</h4>
                  <div className="text-yellow-800">
                    <LaTeXRenderer>{formatUserResponseFromFirestore(selectedQuestionData, questionDetails)}</LaTeXRenderer>
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
