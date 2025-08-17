import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon } from '@heroicons/react/24/outline';

interface EmbedPreviewProps {
  problemId: string;
  slideId: string;
  problemTitle?: string;
  slideTitle?: string;
}

export const EmbedPreview: React.FC<EmbedPreviewProps> = ({ 
  problemId, 
  slideId, 
  problemTitle,
  slideTitle
}) => {
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <BookOpenIcon className="w-5 h-5 text-primary-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-primary-900 mb-1">
            Asking about a Breakdown
          </h3>
          <p className="text-sm text-primary-700">
            {problemTitle && slideTitle ? (
              <>
                <span className="font-medium">{problemTitle}</span>
                <span className="mx-2">•</span>
                <span>{slideTitle}</span>
              </>
            ) : (
              <>
                <span className="font-medium">Problem {problemId}</span>
                <span className="mx-2">•</span>
                <span>Slide {slideId}</span>
              </>
            )}
          </p>
          <Link
            to={`/breakdowns?problem=${problemId}&slide=${slideId}`}
            className="inline-flex items-center mt-2 text-sm text-primary-600 hover:text-primary-700"
          >
            View in Breakdowns →
          </Link>
        </div>
      </div>
    </div>
  );
};



