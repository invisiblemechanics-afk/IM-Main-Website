import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AskCommunityButtonProps {
  problemId: string;
  slideId: string;
  problemTitle?: string;
  slideTitle?: string;
}

export const AskCommunityButton: React.FC<AskCommunityButtonProps> = ({ 
  problemId, 
  slideId,
  problemTitle,
  slideTitle 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!user) {
      toast.error('Please sign in to ask a question');
      navigate('/auth/signin', { 
        state: { 
          from: '/community/new',
          problemId,
          slideId,
          problemTitle,
          slideTitle
        } 
      });
      return;
    }

    navigate('/community/new', {
      state: {
        problemId,
        slideId,
        problemTitle,
        slideTitle
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center space-x-2
        bg-primary-600 text-white
        rounded-full shadow-lg
        transition-all duration-300 ease-in-out
        hover:bg-primary-700 hover:shadow-xl
        ${isHovered ? 'px-4 py-3' : 'p-3'}
      `}
      data-cursor="button"
      title="Ask the Community"
    >
      <QuestionMarkCircleIcon className="w-6 h-6" />
      <span className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isHovered ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'}
      `}>
        Ask the Community
      </span>
    </button>
  );
};



