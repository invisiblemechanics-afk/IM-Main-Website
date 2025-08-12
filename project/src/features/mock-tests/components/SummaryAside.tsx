import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Target, BookOpen } from 'lucide-react';
import { TestBuilderState } from '../types';

interface SummaryAsideProps {
  state: TestBuilderState;
  isValid: boolean;
  onCreateTest: () => void;
}

export default function SummaryAside({ state, isValid, onCreateTest }: SummaryAsideProps) {
  const totalTags = state.skillTags.length;
  
  return (
    <div className="sticky top-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_6px_30px_rgba(0,0,0,0.06)] border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Summary</h3>
        
        <div className="space-y-4 mb-6">
          {/* Test Name */}
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Test Name</span>
            </div>
            <p className="text-gray-900 font-medium">
              {state.name || 'Custom Mock Test'}
            </p>
          </div>

          {/* Exam & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Exam</span>
              </div>
              <p className="text-gray-900 font-medium">{state.exam}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Duration</span>
              </div>
              <p className="text-gray-900 font-medium">{state.durationMin} min</p>
            </div>
          </div>

          {/* Total Questions */}
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Questions</span>
            </div>
            <p className="text-gray-900 font-medium">{state.totalQuestions} questions</p>
          </div>

          {/* Difficulty Distribution */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Difficulty Split</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Easy</span>
                <span className="text-sm font-medium text-green-600">{state.difficulty.easy}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.difficulty.easy}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Moderate</span>
                <span className="text-sm font-medium text-yellow-600">{state.difficulty.moderate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.difficulty.moderate}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tough</span>
                <span className="text-sm font-medium text-red-600">{state.difficulty.tough}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${state.difficulty.tough}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Types */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Question Types</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">MCQ</span>
                <span className="font-medium">{state.types.MCQ}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Multi-Answer</span>
                <span className="font-medium">{state.types.MultipleAnswer}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Numerical</span>
                <span className="font-medium">{state.types.Numerical}</span>
              </div>
            </div>
          </div>

          {/* Selected Topics */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Topics Selected</p>
            <p className="text-sm text-gray-600">
              {totalTags === 0 ? 'All topics' : `${totalTags} topic${totalTags !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Create Button */}
        <motion.button
          whileHover={isValid ? { scale: 1.02 } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
          onClick={onCreateTest}
          disabled={!isValid}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            isValid
              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Create Test
        </motion.button>

        {!isValid && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Complete required fields to enable test creation
          </p>
        )}
      </div>
    </div>
  );
}
