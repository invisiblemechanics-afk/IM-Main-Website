import React from 'react';
import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { QuestionState } from '../types';

interface QuestionNavigatorProps {
  questions: QuestionState[];
  currentIndex: number;
  onQuestionSelect: (index: number) => void;
}

export default function QuestionNavigator({ 
  questions, 
  currentIndex, 
  onQuestionSelect 
}: QuestionNavigatorProps) {
  
  const getQuestionButtonClass = (question: QuestionState, isActive: boolean) => {
    const baseClass = "relative w-10 h-10 rounded-lg font-medium text-sm transition-all duration-200 border-2";
    
    if (isActive) {
      return `${baseClass} bg-blue-600 text-white border-blue-600 shadow-lg scale-110`;
    }
    
    switch (question.status) {
      case 'answered':
        return `${baseClass} ${
          question.isMarkedForReview 
            ? 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200' 
            : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
        }`;
      case 'seen':
        return `${baseClass} bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200`;
      case 'marked':
        return `${baseClass} bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200`;
      case 'unseen':
      default:
        return `${baseClass} bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200`;
    }
  };

  const summary = questions.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    if (q.isMarkedForReview) acc.marked = (acc.marked || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Question Navigator</h3>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Answered ({summary.answered || 0})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
          <span className="text-gray-600">Visited ({summary.seen || 0})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
          <span className="text-gray-600">Marked ({summary.marked || 0})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
          <span className="text-gray-600">Unseen ({summary.unseen || 0})</span>
        </div>
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {questions.map((question, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onQuestionSelect(index)}
            className={getQuestionButtonClass(question, index === currentIndex)}
          >
            <span className="relative z-10">{index + 1}</span>
            {question.isMarkedForReview && (
              <Flag className="absolute top-0 right-0 w-3 h-3 text-purple-600 transform translate-x-1 -translate-y-1" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">←→</kbd> Navigate</p>
        <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">M</kbd> Mark for review</p>
        <p><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">S</kbd> Save & next</p>
      </div>
    </div>
  );
}
