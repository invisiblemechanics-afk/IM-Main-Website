import React, { useState, useEffect, useCallback } from 'react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ThreadCard } from './ThreadCard';
import { LoaderOne } from '../ui/loader';
import { ThreadListItem, SortOption, TimeFilter } from '@/lib/community/types';
import { threadService, voteService, searchService } from '@/services/community';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

interface FeedProps {
  sort: SortOption;
  timeFilter?: TimeFilter;
  searchQuery?: string;
}

export const Feed: React.FC<FeedProps> = ({ sort, timeFilter, searchQuery }) => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const THREADS_PER_PAGE = 20;

  const getTimeFilterDate = useCallback(() => {
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return null;
    }
  }, [timeFilter]);

  const loadThreads = useCallback(async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let fetchedThreads: ThreadListItem[] = [];
      let newLastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

      if (searchQuery) {
        // Use search service
        const results = await searchService.searchThreads(searchQuery, THREADS_PER_PAGE);
        fetchedThreads = results;
        setHasMore(false); // Search doesn't support pagination yet
      } else {
        // Use thread service
        const result = await threadService.getThreads(
          sort,
          timeFilter,
          isLoadMore ? lastDoc : undefined,
          THREADS_PER_PAGE
        );
        
        fetchedThreads = result.threads;
        newLastDoc = result.lastDoc;
        setHasMore(result.threads.length === THREADS_PER_PAGE);
        setLastDoc(newLastDoc);
      }

      // Fetch user votes if authenticated
      if (user && fetchedThreads.length > 0) {
        const threadIds = fetchedThreads.map(t => t.id);
        const userVotes = await voteService.getUserVotes(user.uid, 'thread', threadIds);
        
        fetchedThreads = fetchedThreads.map(thread => ({
          ...thread,
          hasVoted: userVotes[thread.id] || null
        }));
      }

      if (isLoadMore) {
        setThreads(prev => [...prev, ...fetchedThreads]);
      } else {
        setThreads(fetchedThreads);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, timeFilter, searchQuery, lastDoc, user]);

  useEffect(() => {
    loadThreads();
  }, [sort, timeFilter, searchQuery]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadThreads(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoaderOne />
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <ChatBubbleLeftIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery ? 'No results found' : 'No threads yet'}
        </h3>
        <p className="text-gray-500">
          {searchQuery 
            ? 'Try adjusting your search terms'
            : 'Be the first to start a discussion!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map(thread => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}

      {hasMore && !searchQuery && (
        <div className="text-center py-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center space-x-2">
                <LoaderOne size="small" />
                <span>Loading...</span>
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
