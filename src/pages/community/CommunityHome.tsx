import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { Feed } from '../../components/community/Feed';
import { LoaderOne } from '../../components/ui/loader';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SortOption, TimeFilter } from '../../lib/community/types';

export const CommunityHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortOption>('hot');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    document.title = 'Community - Invisible Mechanics';
  }, []);

  const handleNewThread = () => {
    if (!user) {
      // Redirect to sign in if not authenticated
      navigate('/auth/signin', { state: { from: '/community/new' } });
      return;
    }
    navigate('/community/new');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Logo />
              <h1 className="text-xl font-semibold text-gray-900">Community</h1>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search community..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                {isSearching && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* New Thread Button */}
            <button
              onClick={handleNewThread}
              data-cursor="button"
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Thread</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center p-4 border-b border-gray-200">
            <div className="flex space-x-6">
              <button
                onClick={() => { setSort('hot'); setIsSearching(false); setSearchQuery(''); }}
                className={`font-medium ${sort === 'hot' && !isSearching ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                🔥 Hot
              </button>
              <button
                onClick={() => { setSort('new'); setIsSearching(false); setSearchQuery(''); }}
                className={`font-medium ${sort === 'new' && !isSearching ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ✨ New
              </button>
              <button
                onClick={() => { setSort('top'); setIsSearching(false); setSearchQuery(''); }}
                className={`font-medium ${sort === 'top' && !isSearching ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📈 Top
              </button>
            </div>

            {/* Time Filter for Top */}
            {sort === 'top' && !isSearching && (
              <div className="ml-auto">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Feed */}
        <Feed 
          sort={isSearching ? 'hot' : sort}
          timeFilter={timeFilter}
          searchQuery={isSearching ? searchQuery : undefined}
        />
      </main>
    </div>
  );
};



