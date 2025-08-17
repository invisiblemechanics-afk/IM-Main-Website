import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CursorContextType {
  isCustomCursorEnabled: boolean;
  toggleCustomCursor: () => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

interface CursorProviderProps {
  children: ReactNode;
}

export const CursorProvider: React.FC<CursorProviderProps> = ({ children }) => {
  // Initialize from localStorage, default to true (custom cursor enabled)
  const [isCustomCursorEnabled, setIsCustomCursorEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('customCursorEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save to localStorage whenever the state changes
  useEffect(() => {
    localStorage.setItem('customCursorEnabled', JSON.stringify(isCustomCursorEnabled));
    
    // Update the document class to control cursor visibility
    if (isCustomCursorEnabled) {
      document.documentElement.classList.add('custom-cursor');
    } else {
      document.documentElement.classList.remove('custom-cursor');
    }
  }, [isCustomCursorEnabled]);

  const toggleCustomCursor = () => {
    setIsCustomCursorEnabled(prev => !prev);
  };

  return (
    <CursorContext.Provider value={{ isCustomCursorEnabled, toggleCustomCursor }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = (): CursorContextType => {
  const context = useContext(CursorContext);
  if (context === undefined) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};
