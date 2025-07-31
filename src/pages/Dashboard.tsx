import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { BreakdownCard } from '../components/breakdowns/BreakdownCard';
import { ChartBarIcon, Squares2X2Icon, PlayCircleIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getFirestore, collection, doc, onSnapshot, orderBy, query, Timestamp, deleteDoc } from 'firebase/firestore';
import { getAllTopicsWithURLs } from '../lib/data/topics';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  topicTags: string[];
  createdAt: Timestamp;
}

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    playlist: Playlist | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    playlist: null,
    isDeleting: false
  });

  useEffect(() => {
    document.title = 'Dashboard - AuthFlow';
  }, []);

  // Subscribe to user's playlists
  useEffect(() => {
    if (!user) {
      setPlaylists([]);
      setPlaylistsLoading(false);
      return;
    }

    const db = getFirestore();
    const userPlaylistsRef = collection(doc(db, 'users', user.uid), 'playlists');
    const playlistsQuery = query(userPlaylistsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      playlistsQuery,
      (snapshot) => {
        const playlistsData: Playlist[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description || null,
          topicTags: doc.data().topicTags || [],
          createdAt: doc.data().createdAt,
        }));
        
        setPlaylists(playlistsData);
        setPlaylistsLoading(false);
      },
      (error) => {
        console.error('Error fetching playlists:', error);
        setPlaylistsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth/signin';
  };

  // Extract name from user data
  const name = user?.displayName ?? user?.email?.split('@')[0] ?? 'there';

  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handlePlaylistClick = async (playlist: Playlist) => {
    try {
      // Fetch all available topics
      const allTopics = await getAllTopicsWithURLs();
      
      // Filter topics based on playlist's topicTags
      const playlistTopics = allTopics.filter(topic => 
        playlist.topicTags.includes(topic.id)
      );
      
      if (playlistTopics.length === 0) {
        console.warn('No topics found for playlist:', playlist.name);
        return;
      }
      
      // Navigate to course page with the playlist topics
      navigate('/course', {
        state: {
          topics: playlistTopics,
          courseTitle: playlist.name
        }
      });
    } catch (error) {
      console.error('Error loading playlist topics:', error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation(); // Prevent triggering the playlist click
    setDeleteModal({
      isOpen: true,
      playlist,
      isDeleting: false
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.playlist || !user) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const db = getFirestore();
      const playlistRef = doc(db, 'users', user.uid, 'playlists', deleteModal.playlist.id);
      
      await deleteDoc(playlistRef);
      
      // Close modal
      setDeleteModal({
        isOpen: false,
        playlist: null,
        isDeleting: false
      });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      // Reset deleting state but keep modal open
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleDeleteCancel = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({
        isOpen: false,
        playlist: null,
        isDeleting: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-gray-300 hover:border-primary-300"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hi, {name}!
          </h1>
          <p className="text-gray-600 text-lg">
            What would you like to do today?
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {/* Diagnostic Card */}
          <Link
            to="/diagnostic"
            className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-200 cursor-pointer group h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Take a Diagnostic
            </h3>
            <p className="text-gray-600 flex-1">
              Find my ideal Vectors playlist
            </p>
            <div className="flex items-center justify-end mt-4">
              <svg className="w-5 h-5 text-primary-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>

          {/* Manual Build Card */}
          <Link
            to="/builder/manual"
            className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-200 cursor-pointer group h-full flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <Squares2X2Icon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Build a Course Manually
            </h3>
            <p className="text-gray-600 flex-1">
              Hand-pick topics & build playlist
            </p>
            <div className="flex items-center justify-end mt-4">
              <svg className="w-5 h-5 text-primary-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
          </Link>

          {/* Breakdowns Card */}
          <BreakdownCard />
        </div>

        {/* Recent Playlists Section */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Playlists
            </h2>
            
            {playlistsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading playlists...</p>
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8">
                <PlayCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No playlists yet. Create your first one using the options above!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {playlists.slice(0, 5).map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => handlePlaylistClick(playlist)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <PlayCircleIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{playlist.name}</h3>
                        {playlist.description && (
                          <p className="text-sm text-gray-700 mt-1 overflow-hidden" 
                             style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical' as const,
                               maxHeight: '2.5rem'
                             }}>
                            {playlist.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {playlist.topicTags.length} topic{playlist.topicTags.length !== 1 ? 's' : ''} • {formatDate(playlist.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleDeleteClick(e, playlist)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete playlist"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
                
                {playlists.length > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                      And {playlists.length - 5} more...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        playlistName={deleteModal.playlist?.name || ''}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
};