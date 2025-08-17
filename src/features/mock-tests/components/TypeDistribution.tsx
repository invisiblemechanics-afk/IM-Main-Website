import React from 'react';
import { TypeSplit } from '../types';

interface TypeDistributionProps {
  values: TypeSplit;
  totalQuestions: number;
  onChange: (values: TypeSplit) => void;
}

export default function TypeDistribution({ values, totalQuestions, onChange }: TypeDistributionProps) {
  
  const handleChange = (key: keyof TypeSplit, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(totalQuestions, newValue));
    
    // Calculate the remaining questions for other types
    const otherKeys = Object.keys(values).filter(k => k !== key) as (keyof TypeSplit)[];
    const otherTotal = otherKeys.reduce((sum, k) => sum + values[k], 0);
    const remaining = totalQuestions - clampedValue;
    
    if (remaining < 0) return; // Can't exceed total
    
    // Distribute remaining questions proportionally among other types
    const newValues = { ...values, [key]: clampedValue };
    
    if (otherTotal > 0 && remaining !== otherTotal) {
      const ratio = remaining / otherTotal;
      otherKeys.forEach(k => {
        newValues[k] = Math.round(values[k] * ratio);
      });
      
      // Adjust for rounding errors
      const currentSum = Object.values(newValues).reduce((sum, val) => sum + val, 0);
      const diff = totalQuestions - currentSum;
      if (diff !== 0) {
        // Add/subtract the difference to the first other type
        if (otherKeys.length > 0) {
          newValues[otherKeys[0]] += diff;
        }
      }
    }
    
    onChange(newValues);
  };

  const currentSum = values.MCQ + values.MultipleAnswer + values.Numerical;
  const isValid = currentSum === totalQuestions;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Question Type Distribution</h4>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            MCQ (Single)
          </label>
          <input
            type="number"
            min="0"
            max={totalQuestions}
            value={values.MCQ}
            onChange={(e) => handleChange('MCQ', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Single correct answer</p>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Multi-Answer
          </label>
          <input
            type="number"
            min="0"
            max={totalQuestions}
            value={values.MultipleAnswer}
            onChange={(e) => handleChange('MultipleAnswer', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Multiple correct answers</p>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Numerical
          </label>
          <input
            type="number"
            min="0"
            max={totalQuestions}
            value={values.Numerical}
            onChange={(e) => handleChange('Numerical', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Numeric answer</p>
        </div>
      </div>

      {/* Visual Distribution Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
        <div 
          className="bg-primary-500 transition-all duration-300"
          style={{ width: `${totalQuestions > 0 ? (values.MCQ / totalQuestions) * 100 : 0}%` }}
        />
        <div 
          className="bg-primary-400 transition-all duration-300"
          style={{ width: `${totalQuestions > 0 ? (values.MultipleAnswer / totalQuestions) * 100 : 0}%` }}
        />
        <div 
          className="bg-primary-300 transition-all duration-300"
          style={{ width: `${totalQuestions > 0 ? (values.Numerical / totalQuestions) * 100 : 0}%` }}
        />
      </div>

      {/* Sum Check */}
      <div className="text-xs text-center">
        <span className={`${isValid ? 'text-green-600' : 'text-red-600'} font-medium`}>
          Total: {currentSum} / {totalQuestions} questions
        </span>
        {!isValid && (
          <p className="text-red-500 text-xs mt-1">
            {currentSum > totalQuestions 
              ? 'Exceeds total questions' 
              : 'Please allocate all questions'
            }
          </p>
        )}
      </div>
    </div>
  );
}
