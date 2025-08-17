import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Info, BookOpen, Play, CheckCircle, Eye } from 'lucide-react';
import { MockTest } from '../types';
import { useTestAttempt } from '../hooks/useAttempts';
import { formatDuration } from '@/services/mockTestAttempts';

interface TestCardProps {
  test: MockTest;
  onShowDetails: (test: MockTest) => void;
}

const getDifficultyColor = (difficulty: { easy: number; moderate: number; tough: number }) => {
  if (difficulty.tough >= 50) return 'text-red-600 bg-red-50';
  if (difficulty.moderate >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
};

const getDifficultyLabel = (difficulty: { easy: number; moderate: number; tough: number }) => {
  if (difficulty.tough >= 50) return 'Hard';
  if (difficulty.moderate >= 50) return 'Moderate';
  return 'Easy';
};

export default function TestCard({ test, onShowDetails }: TestCardProps) {
  const { hasAttempted, attempt, loading } = useTestAttempt(test.id);

  const handleShowTestDetails = () => {
    onShowDetails(test);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 relative"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 clamp-2 mb-2">
            {test.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {test.exam}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
              {getDifficultyLabel(test.difficulty)}
            </span>
          </div>
        </div>
        {hasAttempted && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{test.totalQuestions} Questions</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{test.duration} min</span>
        </div>
      </div>

      {/* Topics */}
      <div className="mb-4">
        <div className="flex items-center space-x-1 mb-2">
          <BookOpen className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">Topics</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {test.skillTags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {test.skillTags.length > 3 && (
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              +{test.skillTags.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Show attempt results if completed */}
      {hasAttempted && attempt && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-green-800">
                Score: {attempt.totals.score}/{attempt.totals.total} ({attempt.totals.accuracy}%)
              </span>
              <div className="text-green-600 text-xs mt-1">
                Completed {attempt.completedAt} • {formatDuration(attempt.duration * 60)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        {hasAttempted ? (
          // Show "View Results" if already attempted
          <Link
            to={`/mock-tests/result/${attempt?.id}`}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View Results</span>
          </Link>
        ) : (
          // Show "Start Test" if not attempted
          <Link
            to={`/mock-tests/instructions/${test.id}`}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Test</span>
          </Link>
        )}
        <button 
          onClick={handleShowTestDetails}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          title="View test details"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </motion.div>
  );
}
