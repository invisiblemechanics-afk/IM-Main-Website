import React from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export const PracticeCard: React.FC = () => {
  return (
    <Link
      to="/practice"
      className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-200 cursor-pointer group h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
          <AcademicCapIcon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Practice
      </h3>
      <p className="text-gray-600 flex-1">
        Solve practice problems by topic
      </p>
      <div className="flex items-center justify-end mt-4">
        <svg className="w-5 h-5 text-primary-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
        </svg>
      </div>
    </Link>
  );
};