import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { voteService } from '../../services/community';
import { rateLimiter, RATE_LIMITS } from '../../lib/community/rateLimit';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { ChevronUpIcon as ChevronUpSolidIcon, ChevronDownIcon as ChevronDownSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface VoteWidgetProps {
  targetType: 'thread' | 'comment';
  targetId: string;
  threadId?: string; // Required for comment votes
  score: number;
  hasVoted?: 1 | -1 | null;
  onVoteChange?: (newScore: number, vote: 1 | -1 | null) => void;
}

export const VoteWidget: React.FC<VoteWidgetProps> = ({ 
  targetType, 
  targetId,
  threadId, 
  score: initialScore, 
  hasVoted: initialVote,
  onVoteChange 
}) => {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [hasVoted, setHasVoted] = useState<1 | -1 | null>(initialVote || null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    setScore(initialScore);
    setHasVoted(initialVote || null);
  }, [initialScore, initialVote]);

  const handleVote = async (value: 1 | -1) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    if (isVoting) return;

    // Check rate limit
    if (!rateLimiter.check(user.uid, 'vote', RATE_LIMITS.VOTE.limit, RATE_LIMITS.VOTE.window)) {
      toast.error('You\'re voting too quickly. Please slow down.');
      return;
    }

    setIsVoting(true);
    const previousVote = hasVoted;
    const previousScore = score;

    try {
      // Optimistic update
      let newVote: 1 | -1 | null = value;
      let newScore = score;

      if (hasVoted === value) {
        // Clicking same vote again removes it
        newVote = null;
        newScore = score - value;
      } else if (hasVoted === null) {
        // No previous vote
        newScore = score + value;
      } else {
        // Switching vote
        newScore = score - hasVoted + value;
      }

      setHasVoted(newVote);
      setScore(newScore);
      onVoteChange?.(newScore, newVote);

      // Use vote service which handles transactions
      await voteService.vote(user.uid, targetType, targetId, value, threadId);
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to vote. Please try again.');
      
      // Revert optimistic update
      setHasVoted(previousVote);
      setScore(previousScore);
      onVoteChange?.(previousScore, previousVote);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      <button
        onClick={() => handleVote(1)}
        disabled={isVoting}
        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
          hasVoted === 1 ? 'text-primary-600' : 'text-gray-400'
        } disabled:opacity-50`}
        data-cursor="button"
      >
        {hasVoted === 1 ? (
          <ChevronUpSolidIcon className="w-5 h-5" />
        ) : (
          <ChevronUpIcon className="w-5 h-5" />
        )}
      </button>

      <span className={`text-sm font-medium ${
        hasVoted === 1 ? 'text-primary-600' : hasVoted === -1 ? 'text-red-600' : 'text-gray-700'
      }`}>
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
          hasVoted === -1 ? 'text-red-600' : 'text-gray-400'
        } disabled:opacity-50`}
        data-cursor="button"
      >
        {hasVoted === -1 ? (
          <ChevronDownSolidIcon className="w-5 h-5" />
        ) : (
          <ChevronDownIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};
