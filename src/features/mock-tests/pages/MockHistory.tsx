import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Clock3, Calendar, AlertTriangle } from 'lucide-react';
import { useRecentAttempts } from '../hooks/useAttempts';
import { formatDuration } from '../../../services/mockTestAttempts';

export default function MockHistory(): JSX.Element {
  const { attempts: allAttempts, loading, error } = useRecentAttempts(50); // Get more attempts for history

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading test history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Link
                to="/mock-tests"
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200 text-gray-700 hover:text-primary-600"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back to Mock Tests</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test History</h1>
            <p className="text-gray-600">
              {allAttempts.length > 0 
                ? `${allAttempts.length} test${allAttempts.length === 1 ? '' : 's'} completed`
                : 'No tests completed yet'
              }
            </p>
          </div>
        </div>

        {/* Test History List */}
        {allAttempts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Clock3 className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-3">No test history yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start taking mock tests to build your performance history and track your progress over time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/mock-tests/create"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Custom Test
              </Link>
              <Link
                to="/mock-tests/library"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Browse Test Library
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header Row */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-4">Test Name</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-2 text-center">Duration</div>
                <div className="col-span-2 text-center">Date</div>
                <div className="col-span-2 text-center">Actions</div>
              </div>
            </div>

            {/* Test Attempts List */}
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {allAttempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Test Name & Exam */}
                    <div className="col-span-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {attempt.testTitle}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              {attempt.exam}
                            </span>
                            {attempt.isViolation && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Flagged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {attempt.totals.score}/{attempt.totals.total}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {attempt.totals.accuracy}%
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Clock3 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDuration(attempt.duration * 60)}
                        </span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {attempt.completedAt}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 text-center">
                      <Link
                        to={`/mock-tests/result/${attempt.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        View Results
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {allAttempts.length} test{allAttempts.length === 1 ? '' : 's'}
                </span>
                <div className="flex items-center space-x-4">
                  <span>
                    Average Score: {allAttempts.length > 0 
                      ? Math.round(allAttempts.reduce((sum, attempt) => sum + attempt.totals.accuracy, 0) / allAttempts.length)
                      : 0
                    }%
                  </span>
                  <span>
                    Total Tests: {allAttempts.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {allAttempts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Continue Learning</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/mock-tests/create"
                className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create New Test
              </Link>
              <Link
                to="/mock-tests/library"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Browse Library
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
