import { Link } from 'react-router-dom';
import { ListChecks, LibraryBig, Clock3, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import { useRecentAttempts } from '../hooks/useAttempts';
import { formatDuration } from '../../../services/mockTestAttempts';

export default function MockTestsHome(): JSX.Element {
  const { attempts: recentAttempts, loading: attemptsLoading } = useRecentAttempts(3);
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Dashboard Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mock Tests</h1>
            <p className="text-gray-600">Practice with full-length tests to boost your exam performance</p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200 text-gray-700 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Dashboard</span>
          </Link>
        </div>

        {/* Primary Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/mock-tests/create"
            className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-200 cursor-pointer group h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <ListChecks className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create Custom Test</h3>
            <p className="text-gray-600 flex-1">
              Build your own mock test with custom difficulty, topics, and question types. Perfect for targeted practice.
            </p>
            <div className="flex items-center justify-end mt-4">
              <svg className="w-5 h-5 text-primary-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>

          <Link
            to="/mock-tests/library"
            className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-200 cursor-pointer group h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <LibraryBig className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Test Library</h3>
            <p className="text-gray-600 flex-1">
              Access professionally curated mock tests designed by experts. Full-length papers for all major exams.
            </p>
            <div className="flex items-center justify-end mt-4">
              <svg className="w-5 h-5 text-primary-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>
        </div>

        {/* Recent Attempts Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Attempts</h2>
            <Link
              to="/mock-tests/history"
              className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
            >
              View All
            </Link>
          </div>

          {attemptsLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading recent attempts...</p>
            </div>
          ) : recentAttempts.length === 0 ? (
            <div className="text-center py-12">
              <Clock3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent attempts</h3>
              <p className="text-gray-600 mb-6">Start your first mock test to track your progress</p>
              <Link
                to="/mock-tests/create"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Your First Test
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{attempt.testTitle}</h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {attempt.exam}
                        </span>
                        {attempt.isViolation && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Flagged
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{attempt.totals.score}/{attempt.totals.total} ({attempt.totals.accuracy}%)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock3 className="w-4 h-4" />
                          <span>{formatDuration(attempt.duration * 60)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{attempt.completedAt}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/mock-tests/result/${attempt.id}`}
                      className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
