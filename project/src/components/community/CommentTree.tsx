import React, { useState } from 'react';
import { CommentWithChildren } from '../../lib/community/types';
import { VoteWidget } from './VoteWidget';
import { CommentComposer } from './CommentComposer';
import { formatDistanceToNow } from '../../lib/community/utils';
import { useAuth } from '../../context/AuthContext';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface CommentTreeProps {
  comments: CommentWithChildren[];
  threadId: string;
  depth?: number;
  onCommentAdded: () => void;
}

interface CommentNodeProps {
  comment: CommentWithChildren;
  threadId: string;
  depth: number;
  onCommentAdded: () => void;
}

const CommentNode: React.FC<CommentNodeProps> = ({ comment, threadId, depth, onCommentAdded }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showReplyComposer, setShowReplyComposer] = useState(false);

  const hasChildren = comment.children && comment.children.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex space-x-3 mb-4">
        {/* Vote Widget */}
        <div className="flex-shrink-0">
          <VoteWidget
            targetType="comment"
            targetId={comment.id}
            threadId={threadId}
            score={comment.score}
            hasVoted={comment.hasVoted}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <span className="font-medium text-gray-900">
              {comment.author?.username || comment.author?.displayName || 'Anonymous'}
            </span>
            <span>•</span>
            <span>{formatDistanceToNow(comment.createdAt)}</span>
            {hasChildren && (
              <>
                <span>•</span>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  data-cursor="button"
                >
                  {collapsed ? (
                    <>
                      <ChevronDownIcon className="w-3 h-3" />
                      <span>Show {comment.children!.length} replies</span>
                    </>
                  ) : (
                    <>
                      <ChevronUpIcon className="w-3 h-3" />
                      <span>Hide replies</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Body */}
          {!collapsed && (
            <>
              <div 
                className="prose prose-sm max-w-none mb-2"
                dangerouslySetInnerHTML={{ __html: comment.bodyHtmlSanitized }}
              />

              {/* Actions */}
              <div className="flex items-center space-x-4 text-sm">
                {user && (
                  <button
                    onClick={() => setShowReplyComposer(!showReplyComposer)}
                    className="text-gray-500 hover:text-gray-700"
                    data-cursor="button"
                  >
                    Reply
                  </button>
                )}
              </div>

              {/* Reply Composer */}
              {showReplyComposer && (
                <div className="mt-4">
                  <CommentComposer
                    threadId={threadId}
                    parentId={comment.id}
                    onSubmit={() => {
                      setShowReplyComposer(false);
                      onCommentAdded();
                    }}
                    onCancel={() => setShowReplyComposer(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {!collapsed && hasChildren && (
        <div className="mt-4">
          {comment.children!.map(child => (
            <CommentNode
              key={child.id}
              comment={child}
              threadId={threadId}
              depth={depth + 1}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentTree: React.FC<CommentTreeProps> = ({ 
  comments, 
  threadId, 
  depth = 0,
  onCommentAdded 
}) => {
  return (
    <div>
      {comments.map(comment => (
        <CommentNode
          key={comment.id}
          comment={comment}
          threadId={threadId}
          depth={depth}
          onCommentAdded={onCommentAdded}
        />
      ))}
    </div>
  );
};
