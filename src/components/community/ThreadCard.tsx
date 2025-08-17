import React from 'react';
import { Link } from 'react-router-dom';
import { ThreadListItem } from '@/lib/community/types';
import { VoteWidget } from './VoteWidget';
import { formatDistanceToNow } from '@/lib/community/utils';
import { ChatBubbleLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ThreadCardProps {
  thread: ThreadListItem;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({ thread }) => {
  const threadUrl = `/community/t/${thread.id}-${thread.slug}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
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
        <div className="flex-1 min-w-0">
          {/* Title */}
          <Link
            to={threadUrl}
            className="block mb-2"
            data-cursor="button"
          >
            <h3 className="text-lg font-medium text-gray-900 hover:text-primary-600 transition-colors">
              {thread.title}
            </h3>
          </Link>

          {/* Body Preview */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {thread.bodyMarkdown}
          </p>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {/* Author */}
            <span>
              by <span className="font-medium">{thread.author?.username || thread.author?.displayName || 'Anonymous'}</span>
            </span>

            {/* Time */}
            <span>
              {formatDistanceToNow(thread.createdAt)}
            </span>

            {/* Comments */}
            <Link
              to={threadUrl}
              className="flex items-center space-x-1 hover:text-gray-700"
            >
              <ChatBubbleLeftIcon className="w-4 h-4" />
              <span>{thread.commentCount} comments</span>
            </Link>

            {/* Images indicator */}
            {thread.images && thread.images.length > 0 && (
              <span className="flex items-center space-x-1">
                <PhotoIcon className="w-4 h-4" />
                <span>{thread.images.length}</span>
              </span>
            )}

            {/* Tags */}
            {thread.tags && thread.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                {thread.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {thread.tags.length > 3 && (
                  <span className="text-gray-400">+{thread.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Breakdown Context Indicator */}
            {thread.breakdown && (
              <span className="flex items-center space-x-1 text-primary-600">
                <span className="text-xs">📚</span>
                <span>From Breakdowns</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
