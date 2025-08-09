import React from 'react';

interface CircularCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export const CircularCheckbox: React.FC<CircularCheckboxProps> = ({
  checked,
  onChange,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`
        relative w-5 h-5 rounded-full border-2 transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${checked 
          ? 'bg-primary-600 border-primary-600 hover:bg-primary-700 hover:border-primary-700' 
          : 'bg-white border-gray-300 hover:border-primary-400'
        }
        ${className}
      `}
      role="checkbox"
      aria-checked={checked}
    >
      {/* Checkmark Icon */}
      <div className={`
        absolute inset-0 flex items-center justify-center transition-all duration-200 ease-in-out
        ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
      `}>
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      
      {/* Ripple effect for better interaction feedback */}
      <div className={`
        absolute inset-0 rounded-full transition-all duration-200 ease-in-out
        ${checked ? 'bg-primary-600' : 'bg-transparent'}
        ${checked ? 'scale-110 opacity-20' : 'scale-100 opacity-0'}
      `} />
    </button>
  );
};