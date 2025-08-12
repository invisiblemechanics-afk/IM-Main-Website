import React from 'react';

export const OrDivider: React.FC = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-2 text-gray-500">or</span>
      </div>
    </div>
  );
};

export const TextDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-white px-2 text-gray-500">{children}</span>
      </div>
    </div>
  );
};
