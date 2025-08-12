import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { LoaderOne } from '../ui/loader';
import { BookOpenIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

// Try to lazy load the breakdown components
const SlideViewerReadOnly = lazy(() => 
  import('../breakdowns/SlideDeck').then(module => ({
    default: module.SlideDeck
  })).catch(() => ({
    // Fallback component if import fails
    default: () => <div>Unable to load slide viewer</div>
  }))
);

interface EmbeddedBreakdownSlideProps {
  problemId: string;
  slideId: string;
  problemTitle?: string;
  slideTitle?: string;
  snapshotUrl?: string;
}

export const EmbeddedBreakdownSlide: React.FC<EmbeddedBreakdownSlideProps> = ({ 
  problemId, 
  slideId, 
  problemTitle,
  slideTitle,
  snapshotUrl
}) => {
  const breakdownUrl = `/breakdowns?problem=${problemId}&slide=${slideId}`;

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-primary-100 px-4 py-3 border-b border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-200 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-primary-900">
                From Breakdowns
              </h3>
              <p className="text-xs text-primary-700">
                {problemTitle && slideTitle ? (
                  <>
                    <span className="font-medium">{problemTitle}</span>
                    <span className="mx-1">•</span>
                    <span>{slideTitle}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">Problem {problemId}</span>
                    <span className="mx-1">•</span>
                    <span>Slide {slideId}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <Link
            to={breakdownUrl}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
            data-cursor="button"
          >
            <span>Open in Breakdowns</span>
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white">
        {snapshotUrl ? (
          // Static snapshot fallback
          <div className="relative">
            <img
              src={snapshotUrl}
              alt={`${problemTitle || `Problem ${problemId}`} - ${slideTitle || `Slide ${slideId}`}`}
              className="w-full h-auto rounded-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 rounded-lg" />
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <Link
                to={breakdownUrl}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
                data-cursor="button"
              >
                <span>View Interactive Version</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          // Try to render live component
          <div className="min-h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
            <Suspense fallback={
              <div className="text-center">
                <LoaderOne />
                <p className="mt-2 text-sm text-gray-500">Loading slide...</p>
              </div>
            }>
              {/* For now, just show a placeholder since we need to implement the read-only viewer */}
              <div className="text-center p-8">
                <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">
                  This thread references a breakdown slide
                </p>
                <Link
                  to={breakdownUrl}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  data-cursor="button"
                >
                  <span>Open in Breakdowns</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </Link>
              </div>
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};
