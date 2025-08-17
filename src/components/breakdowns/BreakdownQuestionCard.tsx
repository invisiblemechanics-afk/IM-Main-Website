import React from 'react';
import { FirebaseBreakdownQuestion } from '@/lib/data/questions';
import { LaTeXRenderer } from '../LaTeXRenderer';

interface BreakdownQuestionCardProps {
  question: FirebaseBreakdownQuestion;
  onClick: (questionId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Correct Answer':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'Wrong Answer':
      return 'bg-red-50 border-red-200 text-red-800';
    default:
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  }
};

const getExamColor = (exam: string) => {
  switch (exam) {
    case 'JEE Main':
      return 'bg-blue-100 text-blue-800';
    case 'JEE Advanced':
      return 'bg-purple-100 text-purple-800';
    case 'NEET':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};



export const BreakdownQuestionCard: React.FC<BreakdownQuestionCardProps> = ({ question, onClick }) => {
  return (
    <div
      onClick={() => onClick(question.id)}
      className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-primary-300 transition-all duration-200 cursor-pointer group"
    >
      {/* Header with status and type */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
            {question.status}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {question.type}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExamColor(question.exam)}`}>
            {question.exam}
          </span>
        </div>

      </div>

      {/* Question title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
        <LaTeXRenderer>{question.title}</LaTeXRenderer>
      </h3>

      {/* Question preview text */}
      <p className="text-gray-600 text-sm line-clamp-3 mb-3">
        <LaTeXRenderer>{question.text}</LaTeXRenderer>
      </p>

      {/* Footer with chapter info */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="capitalize">{question.chapter}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};