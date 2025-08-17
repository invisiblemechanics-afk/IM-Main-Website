import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { LoaderOne } from '../components/ui/loader';
import { BreakdownCard } from '../components/breakdowns/BreakdownCard';
import { PracticeCard } from '../components/breakdowns/PracticeCard';
import { CommunityTileCard } from '../components/community/CommunityTileCard';
import { CardTile } from '../components/ui/CardTile';
import { SpotlightSection } from '../components/ui/SpotlightSection';
import { COMMUNITY_ENABLED } from '../lib/community';
import { ChartBarIcon, Squares2X2Icon, PlayCircleIcon, TrashIcon, ChevronRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { getFirestore, collection, doc, onSnapshot, orderBy, query, Timestamp, deleteDoc } from 'firebase/firestore';
import { getAllTopicsWithURLs } from '../lib/data/topics';
import ContinueLearningCardStatic from '../components/im-dashboard/ContinueLearningCardStatic';
import StudyCalendarStatic from '../components/im-dashboard/calendar/StudyCalendarStatic';

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
    document.title = 'Dashboard - Invisible Mechanics';
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

  // Check for reduced motion preference
  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface shadow-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            
            <button
              onClick={handleSignOut}
              data-cursor="hover"
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-text-muted hover:text-accent hover:bg-accent-weak rounded-xl transition-colors border border-border hover:border-accent/40 focus-ring"
            >
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <SpotlightSection>
          <div className="mx-auto max-w-3xl text-center py-12">
            <h1 className="text-[32px] leading-[36px] font-semibold tracking-tight2 text-text mb-2">
              Hi, {name}!
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-text-muted">
              What would you like to do today?
            </p>
          </div>
        </SpotlightSection>

        <div className="mt-4 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5 place-items-stretch">

            {/* Continue Learning – static, hardcoded */}
            <div className="col-span-1 md:col-span-2 xl:col-span-2">
              <ContinueLearningCardStatic />
            </div>

            {/* Feature tiles (keep existing components, order as below) */}
            <Link
              to="/diagnostic"
              data-cursor="surround"
              className="block"
            >
              <CardTile
                as="div"
                title="Take a Diagnostic"
                description="Find my ideal Vectors playlist"
                icon={<ChartBarIcon className="w-6 h-6 text-accent" />}
              />
            </Link>

            <Link
              to="/builder/manual"
              data-cursor="surround"
              className="block"
            >
              <CardTile
                as="div"
                title="Build a Course Manually"
                description="Hand-pick topics & build playlist"
                icon={<Squares2X2Icon className="w-6 h-6 text-accent" />}
              />
            </Link>

            <Link
              to="/mock-tests"
              data-cursor="surround"
              className="block"
            >
              <CardTile
                as="div"
                title="Mock Tests"
                description="Take full-length practice tests to boost exam performance"
                icon={<ClipboardDocumentListIcon className="w-6 h-6 text-accent" />}
              />
            </Link>

            <BreakdownCard />

            <PracticeCard />
            
            {COMMUNITY_ENABLED && <CommunityTileCard />}

            {/* Recent Playlists */}
            <div className="col-span-1 md:col-span-3 xl:col-span-4">
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
                <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.01em] text-text">
                  Recent Playlists
                </h2>
                
                {playlistsLoading ? (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <LoaderOne />
                    </div>
                    <p className="text-gray-500">Loading playlists...</p>
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-[rgba(124,92,255,0.12)] ring-1 ring-[rgba(124,92,255,0.25)] flex items-center justify-center">
                      <PlayCircleIcon className="w-6 h-6 text-accent" />
                    </div>
                    <p className="text-text-muted">
                      No playlists yet. Create your first one using the options above!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playlists.slice(0, 5).map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handlePlaylistClick(playlist)}
                        data-cursor="surround"
                        className="group flex w-full items-center justify-between rounded-xl border border-transparent bg-surface px-4 py-4 text-left hover:border-accent/30 hover:shadow-cardHover focus-ring transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-9 w-9 rounded-lg bg-[rgba(124,92,255,0.12)] ring-1 ring-[rgba(124,92,255,0.25)] flex items-center justify-center">
                            <PlayCircleIcon className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h3 className="text-[14px] font-medium text-text">{playlist.name}</h3>
                            {playlist.description && (
                              <p className="text-[12.5px] text-text-muted mt-1 overflow-hidden" 
                                 style={{
                                   display: '-webkit-box',
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: 'vertical' as const,
                                   maxHeight: '2.5rem'
                                 }}>
                                {playlist.description}
                              </p>
                            )}
                            <p className="text-[12.5px] text-text-muted mt-1">
                              {playlist.topicTags.length} topic{playlist.topicTags.length !== 1 ? 's' : ''} • {formatDate(playlist.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleDeleteClick(e, playlist)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 focus-ring"
                            title="Delete playlist"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-text-muted">&#8250;</span>
                        </div>
                      </button>
                    ))}
                    
                    {playlists.length > 5 && (
                      <div className="text-center pt-2">
                        <p className="text-[12.5px] text-text-muted">
                          And {playlists.length - 5} more...
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Study Calendar */}
        <div className="mt-6 max-w-6xl mx-auto px-4">
          <StudyCalendarStatic />
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