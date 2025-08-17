import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { LoaderOne } from '../../components/ui/loader';
import { VoteWidget } from '../../components/community/VoteWidget';
import { CommentTree } from '../../components/community/CommentTree';
import { CommentComposer } from '../../components/community/CommentComposer';
import { EmbeddedBreakdownSlide } from '../../components/community/EmbeddedBreakdownSlide';
import { ShareButton } from '../../components/community/ShareButton';
import { ThreadDetail as ThreadDetailType, CommentWithChildren, BreakdownContext } from '../../lib/community/types';
import { formatDistanceToNow } from '../../lib/community/utils';
import { threadService, commentService, voteService } from '../../services/community';
import { ArrowLeftIcon, ChatBubbleLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const ThreadDetail: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [thread, setThread] = useState<ThreadDetailType | null>(null);
  const [comments, setComments] = useState<CommentWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    if (!threadId) return;

    const loadThread = async () => {
      try {
        // Extract actual thread ID from the URL parameter (remove slug)
        const actualThreadId = threadId.split('-')[0];
        
        // Load thread
        const threadData = await threadService.getThread(actualThreadId);
        
        if (!threadData) {
          toast.error('Thread not found');
          navigate('/community');
          return;
        }

        // Load user vote if authenticated
        if (user) {
          const userVotes = await voteService.getUserVotes(user.uid, 'thread', [actualThreadId]);
          threadData.hasVoted = userVotes[actualThreadId] || null;
        }

        setThread(threadData);
        document.title = `${threadData.title} - Community - Invisible Mechanics`;

        // Load comments
        loadComments(actualThreadId);
      } catch (error) {
        console.error('Error loading thread:', error);
        toast.error('Failed to load thread');
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [threadId, user, navigate]);

  const loadComments = async (threadId: string) => {
    try {
      const allComments = await commentService.getComments(threadId) as CommentWithChildren[];

      // Fetch user votes for comments if authenticated
      if (user && allComments.length > 0) {
        const commentIds = allComments.map(c => c.id);
        const userVotes = await voteService.getUserVotes(user.uid, 'comment', commentIds, threadId);
        
        allComments.forEach(comment => {
          comment.hasVoted = userVotes[comment.id] || null;
        });
      }

      // Build comment tree
      const commentMap = new Map<string, CommentWithChildren>();
      const rootComments: CommentWithChildren[] = [];

      // First pass: create map
      allComments.forEach(comment => {
        comment.children = [];
        commentMap.set(comment.id, comment);
      });

      // Second pass: build tree
      allComments.forEach(comment => {
        if (comment.parentId) {
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.children!.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const handleCommentAdded = () => {
    if (thread) {
      const actualThreadId = threadId!.split('-')[0];
      loadComments(actualThreadId);
      setThread(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thread not found</h2>
          <Link to="/community" className="text-primary-600 hover:text-primary-700">
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/community')}
                className="text-gray-500 hover:text-gray-700"
                data-cursor="button"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <Logo />
            </div>
            
            <ShareButton url={window.location.href} title={thread.title} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Thread Content */}
          <div className="p-6">
            <div className="flex space-x-4">
              {/* Vote Widget */}
              <div className="flex-shrink-0">
                <VoteWidget
                  targetType="thread"
                  targetId={thread.id}
                  score={thread.score}
                  hasVoted={thread.hasVoted}
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {thread.title}
                </h1>

                {/* Embedded Breakdown */}
                {thread.breakdown && (
                  <div className="mb-6">
                    <EmbeddedBreakdownSlide
                      problemId={thread.breakdown.problemId}
                      slideId={thread.breakdown.slideId}
                      problemTitle={undefined}
                      slideTitle={undefined}
                      snapshotUrl={thread.breakdown.snapshotUrl}
                    />
                  </div>
                )}

                {/* Body */}
                <div 
                  className="prose prose-sm max-w-none mb-4"
                  dangerouslySetInnerHTML={{ __html: thread.bodyHtmlSanitized }}
                />

                {/* Images */}
                {thread.images && thread.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {thread.images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    by <span className="font-medium">{thread.author?.username || thread.author?.displayName || 'Anonymous'}</span>
                  </span>
                  <span>{formatDistanceToNow(thread.createdAt)}</span>
                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {thread.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span>{thread.commentCount} Comments</span>
                </h2>
                {user && (
                  <button
                    onClick={() => setShowComposer(!showComposer)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    data-cursor="button"
                  >
                    Add Comment
                  </button>
                )}
              </div>

              {/* Comment Composer */}
              {showComposer && (
                <div className="mb-6">
                  <CommentComposer
                    threadId={thread.id}
                    onSubmit={() => {
                      setShowComposer(false);
                      handleCommentAdded();
                    }}
                    onCancel={() => setShowComposer(false)}
                  />
                </div>
              )}

              {/* Comments Tree */}
              {comments.length > 0 ? (
                <CommentTree 
                  comments={comments} 
                  threadId={thread.id}
                  onCommentAdded={handleCommentAdded}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {user ? (
                    <p>No comments yet. Be the first to comment!</p>
                  ) : (
                    <p>
                      No comments yet.{' '}
                      <Link to="/auth/signin" className="text-primary-600 hover:text-primary-700">
                        Sign in
                      </Link>{' '}
                      to add a comment.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
