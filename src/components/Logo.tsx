import React from 'react';
import { Link } from 'react-router-dom';

export const Logo: React.FC = () => {
  return (
    <Link to="/" className="inline-block">
      <svg
        width="120"
        height="32"
        viewBox="0 0 120 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-indigo-600 dark:text-indigo-400"
      >
        <rect width="8" height="32" rx="4" fill="currentColor" />
        <rect x="12" width="8" height="24" rx="4" fill="currentColor" opacity="0.8" />
        <rect x="24" width="8" height="28" rx="4" fill="currentColor" opacity="0.6" />
        <text
          x="40"
          y="20"
          className="fill-gray-900 dark:fill-gray-100 text-lg font-bold"
          style={{ fontSize: '18px', fontFamily: 'system-ui' }}
        >
          AuthFlow
        </text>
      </svg>
    </Link>
  );
};