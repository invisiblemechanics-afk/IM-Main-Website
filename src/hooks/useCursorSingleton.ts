'use client';

import { useEffect, useState } from 'react';
import { useCursor } from '../context/CursorContext';

export function useCursorSingleton() {
  const [enabled, setEnabled] = useState(false);
  const { isCustomCursorEnabled } = useCursor();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const fine = matchMedia('(pointer:fine)').matches;
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!fine || rm || !isCustomCursorEnabled) {
      setEnabled(false);
      return;
    }
    
    if (!(window as any).IM_CURSOR_MOUNTED) {
      (window as any).IM_CURSOR_MOUNTED = true;
      setEnabled(true);
    }
    
    // Dev guard: remove older stray nodes (HMR)
    const nodes = document.querySelectorAll('.im-cursor');
    nodes.forEach((n, i) => { 
      if (i < nodes.length - 1) n.remove(); 
    });
  }, [isCustomCursorEnabled]);
  
  return enabled && isCustomCursorEnabled;
}