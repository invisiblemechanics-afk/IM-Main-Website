import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllTopicsWithURLs, TopicWithURL } from '../lib/data/topics';
import { Navigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

// Location state passed from Diagnostic results screen
interface LocationState {
  preselected?: string[]; // topic IDs answered incorrectly
}

export const ManualBuilder: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const [topics, setTopics] = useState<TopicWithURL[]>([]);
  const [preselectedFromDiagnostic, setPreselectedFromDiagnostic] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Store the preselected IDs from diagnostic for later matching
  useEffect(() => {
    if (state?.preselected) {
      setPreselectedFromDiagnostic(state.preselected);
    }
  }, [state]);

  // Initialise selection as empty first, then update after topics load
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    document.title = 'Build Course Manually - AuthFlow';
  }, []);

  useEffect(() => {
    const loadTopics = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        const topicsData = await getAllTopicsWithURLs();
        setTopics(topicsData);

        // After topics are loaded, match preselected IDs with actual topic data
        if (preselectedFromDiagnostic.length > 0) {
          const matchedTopicIds = new Set<string>();
          
          // First try direct ID matching
          preselectedFromDiagnostic.forEach(preselectedId => {
            const directMatch = topicsData.find(topic => topic.id === preselectedId);
            if (directMatch) {
              matchedTopicIds.add(directMatch.id);
            }
          });

          // If no direct matches found, try matching by title (skillTag might be converted to title)
          if (matchedTopicIds.size === 0) {
            preselectedFromDiagnostic.forEach(preselectedId => {
              // Try to find topic by converting preselected ID to title format
              const titleMatch = topicsData.find(topic => 
                topic.title.toLowerCase().replace(/\s+/g, '-') === preselectedId.toLowerCase() ||
                topic.title.toLowerCase().replace(/\s+/g, '_') === preselectedId.toLowerCase() ||
                topic.title.toLowerCase() === preselectedId.toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ')
              );
              if (titleMatch) {
                matchedTopicIds.add(titleMatch.id);
              }
            });
          }

          setSelectedIds(matchedTopicIds);
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
        setError(error instanceof Error ? error.message : 'Failed to load topics');
      } finally {
        setIsLoading(false);
      }
    };

    loadTopics();
  }, [preselectedFromDiagnostic]);

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

  const handleTopicToggle = (topicId: string): void => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCreatePlaylist = (): void => {
    if (selectedIds.size === 0) return;
    
    const selectedTopics = topics.filter(topic => selectedIds.has(topic.id));
    
    // Navigate to course page with selected topics
    navigate('/course', { 
      state: { 
        topics: selectedTopics,
        courseTitle: `Custom Vector Course (${selectedTopics.length} topics)`
      } 
    });
  };

  // Filter topics based on search term
  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Build Course Manually
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select topics to create your personalized learning playlist
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading topics...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400 mb-4">
                Error loading topics: {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* Topics List */}
              <div className="space-y-4 overflow-y-auto max-h-[70vh] mb-6 pr-4">
                {filteredTopics.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No topics match your search.' : 'No topics found in the database. Please add some topics to get started.'}
                    </p>
                  </div>
                ) : (
                  filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      {/* Topic Info */}
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                          {topic.title}
                        </h3>
                        <div className="flex items-center mt-1 space-x-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDuration(topic.durationSec)}
                          </span>
                          {topic.prereq.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {topic.prereq.length} prerequisite{topic.prereq.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Checkbox - Centered vertically */}
                      <div className="flex items-center justify-center ml-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(topic.id)}
                          onChange={() => handleTopicToggle(topic.id)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Create Playlist Button */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedIds.size > 0 ? (
                      `${selectedIds.size} topic${selectedIds.size !== 1 ? 's' : ''} selected`
                    ) : (
                      'Select topics to create your playlist'
                    )}
                    {searchTerm && (
                      <span className="ml-2 text-xs">
                        ({filteredTopics.length} shown)
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={selectedIds.size === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Create Playlist
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};