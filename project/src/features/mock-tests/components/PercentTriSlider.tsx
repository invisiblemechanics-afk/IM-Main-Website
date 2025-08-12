import React from 'react';
import { DifficultySplit } from '../types';

interface PercentTriSliderProps {
  values: DifficultySplit;
  onChange: (values: DifficultySplit) => void;
  labels?: {
    easy?: string;
    moderate?: string;
    tough?: string;
  };
}

export default function PercentTriSlider({ 
  values, 
  onChange, 
  labels = { easy: 'Easy', moderate: 'Moderate', tough: 'Tough' }
}: PercentTriSliderProps) {
  
  const handleChange = (key: keyof DifficultySplit, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(100, newValue));
    
    if (key === 'easy') {
      const remaining = 100 - clampedValue;
      const moderateRatio = values.moderate / (values.moderate + values.tough) || 0.5;
      const newModerate = Math.round(remaining * moderateRatio);
      const newTough = remaining - newModerate;
      
      onChange({
        easy: clampedValue,
        moderate: newModerate,
        tough: newTough
      });
    } else if (key === 'moderate') {
      const remaining = 100 - clampedValue;
      const easyRatio = values.easy / (values.easy + values.tough) || 0.5;
      const newEasy = Math.round(remaining * easyRatio);
      const newTough = remaining - newEasy;
      
      onChange({
        easy: newEasy,
        moderate: clampedValue,
        tough: newTough
      });
    } else if (key === 'tough') {
      const remaining = 100 - clampedValue;
      const easyRatio = values.easy / (values.easy + values.moderate) || 0.5;
      const newEasy = Math.round(remaining * easyRatio);
      const newModerate = remaining - newEasy;
      
      onChange({
        easy: newEasy,
        moderate: newModerate,
        tough: clampedValue
      });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Difficulty Distribution</h4>
      
      {/* Visual Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
        <div 
          className="bg-green-500 transition-all duration-300"
          style={{ width: `${values.easy}%` }}
        />
        <div 
          className="bg-yellow-500 transition-all duration-300"
          style={{ width: `${values.moderate}%` }}
        />
        <div 
          className="bg-red-500 transition-all duration-300"
          style={{ width: `${values.tough}%` }}
        />
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {labels.easy}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={values.easy}
              onChange={(e) => handleChange('easy', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {labels.moderate}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={values.moderate}
              onChange={(e) => handleChange('moderate', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {labels.tough}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={values.tough}
              onChange={(e) => handleChange('tough', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Sum Check */}
      <div className="text-xs text-center">
        <span className={`${
          values.easy + values.moderate + values.tough === 100 
            ? 'text-green-600' 
            : 'text-red-600'
        } font-medium`}>
          Total: {values.easy + values.moderate + values.tough}%
        </span>
      </div>
    </div>
  );
}
