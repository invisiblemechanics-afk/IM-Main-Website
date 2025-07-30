import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordEyeToggleProps {
  show: boolean;
  onToggle: () => void;
}

export const PasswordEyeToggle: React.FC<PasswordEyeToggleProps> = ({ show, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? (
        <EyeOff className="w-5 h-5" />
      ) : (
        <Eye className="w-5 h-5" />
      )}
    </button>
  );
};