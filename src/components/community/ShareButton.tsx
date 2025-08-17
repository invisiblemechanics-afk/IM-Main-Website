import React, { useState } from 'react';
import { ShareIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  url: string;
  title: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ url, title }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      data-cursor="button"
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <ShareIcon className="w-4 h-4" />
          <span>Share</span>
        </>
      )}
    </button>
  );
};



