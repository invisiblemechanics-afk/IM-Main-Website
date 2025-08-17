import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, BookOpen, Target, Clock } from 'lucide-react';
import { TestBuilderState } from '../types';
import SummaryAside from '../components/SummaryAside';
import PercentTriSlider from '../components/PercentTriSlider';
import TypeDistribution from '../components/TypeDistribution';
import GlobalTagPicker from '../components/GlobalTagPicker';

const initialState: TestBuilderState = {
  name: '',
  exam: 'JEE Main',
  durationMin: 180,
  shuffleQuestions: true,
  shuffleOptions: true,
  usePerQuestionMarks: true,
  marksCorrect: 4,
  marksWrong: -1,
  totalQuestions: 30,
  difficulty: { easy: 30, moderate: 50, tough: 20 },
  types: { MCQ: 25, MultipleAnswer: 3, Numerical: 2 },
  skillTags: []
};

export default function MockCreate() {
  const navigate = useNavigate();
  const [state, setState] = useState<TestBuilderState>(initialState);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'basics', title: 'Test Basics', icon: Settings },
    { id: 'syllabus', title: 'Syllabus & Topics', icon: BookOpen },
    { id: 'questions', title: 'Question Mix', icon: Target },
    { id: 'scoring', title: 'Scoring Rules', icon: Clock }
  ];

  const updateState = (updates: Partial<TestBuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const isValidConfig = () => {
    const typeSum = state.types.MCQ + state.types.MultipleAnswer + state.types.Numerical;
    const difficultySum = state.difficulty.easy + state.difficulty.moderate + state.difficulty.tough;
    
    return (
      state.totalQuestions > 0 &&
      typeSum === state.totalQuestions &&
      difficultySum === 100 &&
      state.durationMin > 0
    );
  };

  const handleCreateTest = () => {
    // TODO: call generator to fetch N questions by filters from chapter subcollections "<chapter>-Test-Questions"
    console.log('Test Configuration:', state);
    
    // Navigate to attempt page with temporary ID
    navigate('/mock-tests/attempt/temp');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basics
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name (Optional)
              </label>
              <input
                type="text"
                value={state.name}
                onChange={(e) => updateState({ name: e.target.value })}
                placeholder="Custom Mock Test"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Exam
                </label>
                <select
                  value={state.exam}
                  onChange={(e) => updateState({ exam: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="JEE Main">JEE Main</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                  <option value="NEET">NEET</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={state.durationMin}
                  onChange={(e) => updateState({ durationMin: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="300"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Test Options</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={state.shuffleQuestions}
                    onChange={(e) => updateState({ shuffleQuestions: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Shuffle questions</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={state.shuffleOptions}
                    onChange={(e) => updateState({ shuffleOptions: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Shuffle answer options</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 1: // Syllabus & Topics
        return (
          <div className="space-y-6">
            <GlobalTagPicker
              selectedTags={state.skillTags}
              onChange={(tags) => updateState({ skillTags: tags })}
            />
          </div>
        );

      case 2: // Question Mix
        return (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Total Questions
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={state.totalQuestions}
                onChange={(e) => {
                  const newTotal = parseInt(e.target.value);
                  // Proportionally adjust type distribution
                  const ratio = newTotal / state.totalQuestions;
                  updateState({
                    totalQuestions: newTotal,
                    types: {
                      MCQ: Math.round(state.types.MCQ * ratio),
                      MultipleAnswer: Math.round(state.types.MultipleAnswer * ratio),
                      Numerical: Math.round(state.types.Numerical * ratio)
                    }
                  });
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>10</span>
                <span className="font-medium text-lg text-blue-600">{state.totalQuestions}</span>
                <span>100</span>
              </div>
            </div>

            <PercentTriSlider
              values={state.difficulty}
              onChange={(values) => updateState({ difficulty: values })}
            />

            <TypeDistribution
              values={state.types}
              totalQuestions={state.totalQuestions}
              onChange={(values) => updateState({ types: values })}
            />
          </div>
        );

      case 3: // Scoring
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-3 mb-4">
                <input
                  type="radio"
                  checked={state.usePerQuestionMarks}
                  onChange={() => updateState({ usePerQuestionMarks: true })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Auto (use per-question marks)
                </span>
              </label>
              <p className="text-sm text-gray-600 ml-7">
                Use the marking scheme defined for each question in the database
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3 mb-4">
                <input
                  type="radio"
                  checked={!state.usePerQuestionMarks}
                  onChange={() => updateState({ usePerQuestionMarks: false })}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Manual override
                </span>
              </label>

              {!state.usePerQuestionMarks && (
                <div className="ml-7 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marks for Correct Answer
                    </label>
                    <input
                      type="number"
                      value={state.marksCorrect || 4}
                      onChange={(e) => updateState({ marksCorrect: parseInt(e.target.value) || 4 })}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Negative Marks for Wrong Answer
                    </label>
                    <input
                      type="number"
                      value={state.marksWrong || -1}
                      onChange={(e) => updateState({ marksWrong: parseInt(e.target.value) || -1 })}
                      max="0"
                      min="-5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/mock-tests')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Custom Test</h1>
            <p className="text-gray-600">Configure your personalized mock test</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Stepper */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => setCurrentStep(index)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                        >
                          <StepIcon className="w-5 h-5" />
                        </button>
                        <span className={`text-xs mt-2 font-medium ${
                          isActive ? 'text-primary-600' : 'text-gray-600'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-px mx-4 transition-colors ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Step Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {steps[currentStep].title}
                </h3>
                {renderStepContent()}
              </motion.div>

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <SummaryAside
              state={state}
              isValid={isValidConfig()}
              onCreateTest={handleCreateTest}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
