import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { TopicWithURL } from '../lib/data/topics';
import { Play, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomVideoPlayer from '../components/CustomVideoPlayer';

interface CourseState {
  topics: TopicWithURL[];
  courseTitle: string;
}

export const Course: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const state = location.state as CourseState;
  
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    document.title = `${state?.courseTitle || 'Course'} - Invisible Mechanics`;
  }, [state?.courseTitle]);

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

  // Redirect if no course data
  if (!state || !state.topics || state.topics.length === 0) {
    return <Navigate to="/builder/manual" replace />;
  }

  const { topics, courseTitle } = state;
  const currentTopic = topics[currentTopicIndex];

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTopicSelect = (index: number): void => {
    setCurrentTopicIndex(index);
    setVideoError(null);
    setVideoLoading(true);
  };

  const handleVideoEnded = (): void => {
    // Mark current topic as completed
    setCompletedTopics(prev => new Set([...prev, currentTopic.id]));
    
    // Auto-advance to next topic if available
    if (currentTopicIndex < topics.length - 1) {
      setTimeout(() => {
        setCurrentTopicIndex(prev => prev + 1);
        setVideoError(null);
        setVideoLoading(true);
      }, 2000);
    }
  };

  const handleVideoLoadedData = (): void => {
    setVideoLoading(false);
    setVideoError(null);
    console.log(`🎥 Video loaded successfully: ${currentTopic.title}`);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>): void => {
    const video = e.target as HTMLVideoElement;
    const error = video.error;
    
    let errorMessage = 'Unknown video error';
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading video';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video format not supported';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video source not supported';
          break;
        default:
          errorMessage = `Video error (code: ${error.code})`;
      }
    }
    
    setVideoError(errorMessage);
    setVideoLoading(false);
    console.error(`❌ Video error for ${currentTopic.title}:`, errorMessage, error);
  };

  const getTotalDuration = (): string => {
    const totalSeconds = topics.reduce((sum, topic) => sum + topic.durationSec, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getCompletionPercentage = (): number => {
    return Math.round((completedTopics.size / topics.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo />
            <div className="text-gray-900">
              <h1 className="text-lg font-semibold">{courseTitle}</h1>
              <p className="text-sm text-gray-600">
                {completedTopics.size} of {topics.length} topics completed • {getTotalDuration()}
              </p>
            </div>
          </div>
          
          <Link
            to="/dashboard"
            className="text-gray-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Course Progress</span>
            <span className="font-semibold text-primary-600">{getCompletionPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-auto">
        {/* Video Player - Left Side */}
        <div className="flex-1 bg-black flex flex-col min-h-[400px]">
          <div className="relative flex-1 min-h-[300px]">
            {videoLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">Loading video...</p>
                </div>
              </div>
            )}
            
            {videoError && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-lg mb-2 text-gray-900 font-semibold">Video failed to load</p>
                  <p className="text-sm text-gray-600 mb-4">{videoError}</p>
                  <button
                    onClick={() => {
                      setVideoError(null);
                      setVideoLoading(true);
                      const video = document.getElementById(`video-${currentTopic.id}`) as HTMLVideoElement;
                      if (video) {
                        video.load();
                      }
                    }}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            
            <CustomVideoPlayer
              id={`video-${currentTopic.id}`}
              key={currentTopic.id}
              src={currentTopic.videoURL}
              className="absolute inset-0 w-full h-full"
              onLoadedData={handleVideoLoadedData}
              onError={handleVideoError}
              onEnded={handleVideoEnded}
              onPlay={() => console.log(`▶️ Video started playing: ${currentTopic.title}`)}
              onLoadedMetadata={() => {
                console.log(`📊 Video metadata loaded: ${currentTopic.title}`);
                setVideoLoading(false);
              }}
            />
          </div>
          
          {/* Video Info */}
          <div className="p-6 bg-white border-t border-gray-200">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">{currentTopic.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDuration(currentTopic.durationSec)}
              </div>
              <span>Topic {currentTopicIndex + 1} of {topics.length}</span>
              {completedTopics.has(currentTopic.id) && (
                <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Completed
                </div>
              )}
            </div>
            {currentTopic.description && (
              <p className="mt-4 text-gray-700">{currentTopic.description}</p>
            )}
          </div>
        </div>

        {/* Playlist - Right Side */}
        <div className={`${sidebarMinimized ? 'w-16' : 'w-96'} bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg min-h-[400px]`}>
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              {!sidebarMinimized && (
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Content</h3>
                  <p className="text-sm text-gray-600">{topics.length} topics • {getTotalDuration()}</p>
                </div>
              )}
              <button
                onClick={() => setSidebarMinimized(!sidebarMinimized)}
                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                aria-label={sidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
              >
                {sidebarMinimized ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {topics.map((topic, index) => (
              <div
                key={topic.id}
                onClick={() => handleTopicSelect(index)}
                className={`${sidebarMinimized ? 'p-2' : 'p-4'} border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-primary-50 ${
                  index === currentTopicIndex ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                }`}
                title={sidebarMinimized ? topic.title : undefined}
              >
                {sidebarMinimized ? (
                  <div className="flex flex-col items-center space-y-1">
                    <div className="flex-shrink-0">
                      {completedTopics.has(topic.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : index === currentTopicIndex ? (
                        <Play className="w-5 h-5 text-primary-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 text-center font-medium">
                      {index + 1}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-1">
                      {completedTopics.has(topic.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : index === currentTopicIndex ? (
                        <Play className="w-5 h-5 text-primary-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-sm ${
                        index === currentTopicIndex ? 'text-primary-700' : 'text-gray-900'
                      }`}>
                        {topic.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        {formatDuration(topic.durationSec)}
                      </p>
                      {topic.prereq.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Prerequisites: {topic.prereq.length} topic{topic.prereq.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};