import React from 'react';
import { IconPointer, IconPointerOff } from '@tabler/icons-react';
import { useCursor } from '../context/CursorContext';

export const CursorToggle: React.FC = () => {
  const { isCustomCursorEnabled, toggleCustomCursor } = useCursor();

  return (
    <button
      onClick={toggleCustomCursor}
      className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-md hover:bg-white/90 transition-all duration-200 group"
      title={isCustomCursorEnabled ? 'Switch to default cursor' : 'Switch to custom cursor'}
      aria-label={isCustomCursorEnabled ? 'Switch to default cursor' : 'Switch to custom cursor'}
    >
      {isCustomCursorEnabled ? (
        <IconPointer className="h-5 w-5 text-neutral-600 group-hover:text-neutral-800 transition-colors duration-200" />
      ) : (
        <IconPointerOff className="h-5 w-5 text-neutral-600 group-hover:text-neutral-800 transition-colors duration-200" />
      )}
    </button>
  );
};
