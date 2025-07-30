import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ChartBarIcon, Squares2X2Icon, ChevronRightIcon } from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  useEffect(() => {
    document.title = 'Dashboard - AuthFlow';
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth/signin';
  };

  // Extract name from user data
  const name = user?.displayName ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
            >
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mx-auto max-w-3xl text-center py-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Hi, {name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            What would you like to do today?
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {/* Diagnostic Card */}
          <Link
            to="/diagnostic"
            className="group bg-white dark:bg-gray-800/70 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-6 flex flex-col justify-between shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 grid place-content-center mb-4">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Take a Diagnostic
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Find my ideal Vectors playlist
              </p>
            </div>
            <div className="flex items-center justify-end mt-4">
              <ChevronRightIcon className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </Link>

          {/* Manual Build Card */}
          <Link
            to="/builder/manual"
            className="group bg-white dark:bg-gray-800/70 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-6 flex flex-col justify-between shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl"
          >
            <div>
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 grid place-content-center mb-4">
                <Squares2X2Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Build a Course Manually
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Hand-pick topics & build playlist
              </p>
            </div>
            <div className="flex items-center justify-end mt-4">
              <ChevronRightIcon className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </Link>
        </div>

        {/* Recent Playlists Section (Optional - placeholder for future implementation) */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Recent Playlists
            </h2>
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No playlists yet. Create your first one using the options above!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};