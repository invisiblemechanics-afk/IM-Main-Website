import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllTopicsWithURLs, TopicWithURL } from '../lib/data/topics';
import { Navigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { SavePlaylistModal } from '../components/SavePlaylistModal';
import { CircularCheckbox } from '../components/CircularCheckbox';
import { ChevronDown, ChevronRight } from 'lucide-react';


// Location state passed from Diagnostic results screen
interface LocationState {
  preselected?: string[]; // topic IDs answered incorrectly
  selectedChapter?: string; // chapter ID selected in diagnostic
}

interface Chapter {
  id: string;
  name: string;
}

export const ManualBuilder: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: LocationState };
  const [topics, setTopics] = useState<TopicWithURL[]>([]);
  const [preselectedFromDiagnostic, setPreselectedFromDiagnostic] = useState<string[]>([]);
  const [selectedChapterFromDiagnostic, setSelectedChapterFromDiagnostic] = useState<string>('Vectors');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Store the preselected IDs and chapter from diagnostic for later matching
  useEffect(() => {
    if (state?.preselected) {
      setPreselectedFromDiagnostic(state.preselected);
    }
    if (state?.selectedChapter) {
      setSelectedChapterFromDiagnostic(state.selectedChapter);
    }
  }, [state]);

  // Initialise selection as empty first, then update after topics load
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Chapter accordion state
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [chapterTopics, setChapterTopics] = useState<Record<string, TopicWithURL[]>>({});
  useEffect(() => {
    document.title = 'Build Course Manually - AuthFlow';
  }, []);

  // Fetch topics using the existing structure
  useEffect(() => {
    const loadChapterTopics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use chapter-aware topics loading function
        const topicsData = await getAllTopicsWithURLs(selectedChapterFromDiagnostic);
        
        // Create a single chapter with all topics based on selected chapter
        const selectedChapter: Chapter = {
          id: selectedChapterFromDiagnostic,
          name: selectedChapterFromDiagnostic
        };
        
        setChapters([selectedChapter]);
        setChapterTopics({ [selectedChapterFromDiagnostic]: topicsData });
        setTopics(topicsData); // Keep the existing topics array for compatibility
        
        // Expand the selected chapter by default
        setExpanded({ [selectedChapterFromDiagnostic]: true });

        // Handle preselected topics from diagnostic
        if (preselectedFromDiagnostic.length > 0) {
          const matchedTopicIds = new Set<string>();
          
          preselectedFromDiagnostic.forEach(preselectedId => {
            const directMatch = topicsData.find(topic => topic.id === preselectedId);
            if (directMatch) {
              matchedTopicIds.add(directMatch.id);
            }
          });

          if (matchedTopicIds.size > 0) {
            setSelectedIds(matchedTopicIds);
            console.log(`Preselected ${matchedTopicIds.size} topics from diagnostic`);
          }
        }
      } catch (error) {
        console.error('Error loading chapter topics:', error);
        setError('Failed to load topics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadChapterTopics();
  }, [preselectedFromDiagnostic, selectedChapterFromDiagnostic]);

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
    setIsModalOpen(true);
  };

  const handleSaveSuccess = (): void => {
    // Navigate to course page with selected topics after saving
    const selectedTopics = topics.filter(topic => selectedIds.has(topic.id));
    navigate('/course', { 
      state: { 
        topics: selectedTopics,
        courseTitle: `Custom Vector Course (${selectedTopics.length} topics)`
      } 
    });
  };

  const handleModalClose = (): void => {
    setIsModalOpen(false);
  };

  const toggleChapter = (chapterId: string): void => {
    setExpanded(e => ({ ...e, [chapterId]: !e[chapterId] }));
  };

  // Filter topics based on search term (kept for compatibility)
  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-sm font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Build Course Manually
          </h1>
          <p className="text-gray-600 mb-6">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading topics...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">
                Error loading topics: {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-primary-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* Chapter Accordion */}
              <div className="space-y-4 overflow-y-auto max-h-[70vh] mb-6 pr-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-500">
                      Loading topics...
                    </p>
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No topics found. Please check your connection and try again.
                    </p>
                  </div>
                ) : (
                  chapters
                    .filter(chapter => {
                      if (!searchTerm) return true;
                      const topicsInChapter = chapterTopics[chapter.id] || [];
                      return topicsInChapter.some(topic =>
                        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                    })
                    .map(chapter => {
                      const topicsInChapter = chapterTopics[chapter.id] || [];
                      const filteredChapterTopics = searchTerm
                        ? topicsInChapter.filter(topic =>
                            topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                        : topicsInChapter;

                      if (filteredChapterTopics.length === 0) return null;

                      return (
                        <div key={chapter.id} className="mb-6">
                          {/* Chapter Header */}
                          <div
                            onClick={() => toggleChapter(chapter.id)}
                            className="cursor-pointer bg-primary-50 hover:bg-primary-100 transition-colors p-4 rounded-lg border border-primary-200 mb-3"
                          >
                            <div className="flex items-center justify-between">
                              <h2 className="text-lg font-semibold text-primary-700">
                                {chapter.name}
                              </h2>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-primary-600">
                                  {filteredChapterTopics.length} topic{filteredChapterTopics.length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors">
                                  {expanded[chapter.id] ? (
                                    <ChevronDown className="w-4 h-4 text-primary-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-primary-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Topics in Chapter */}
                          {expanded[chapter.id] && (
                            <div className="space-y-2 ml-4">
                              {filteredChapterTopics.map((topic) => (
                                <div
                                  key={topic.id}
                                  className="bg-gray-50 p-3 rounded-lg flex items-center hover:bg-gray-100 transition-colors"
                                >
                                  {/* Topic Info */}
                                  <div className="flex-1">
                                    <h3 className="text-base font-medium text-gray-900">
                                      {topic.title}
                                    </h3>
                                    <div className="flex items-center mt-1 space-x-4">
                                      <span className="text-sm text-gray-600">
                                        {formatDuration(topic.durationSec)}
                                      </span>
                                      {topic.prereq.length > 0 && (
                                        <span className="text-xs text-gray-500">
                                          {topic.prereq.length} prerequisite{topic.prereq.length !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Checkbox - Centered vertically */}
                                  <div className="flex items-center justify-center ml-4">
                                    <CircularCheckbox
                                      checked={selectedIds.has(topic.id)}
                                      onChange={() => handleTopicToggle(topic.id)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                    .filter(Boolean)
                )}
              </div>

              {/* Create Playlist Button */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
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
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Create Playlist
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      {/* Save Playlist Modal */}
      <SavePlaylistModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedTopics={Array.from(selectedIds)}
        onSuccess={handleSaveSuccess}
      />
    </div>
  );
};