'use client';

import { useEffect, useState } from 'react';

export function useCursorSingleton() {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const fine = matchMedia('(pointer:fine)').matches;
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!fine || rm) return;
    
    if (!(window as any).IM_CURSOR_MOUNTED) {
      (window as any).IM_CURSOR_MOUNTED = true;
      document.documentElement.classList.add('custom-cursor');
      setEnabled(true);
    }
    
    // Dev guard: remove older stray nodes (HMR)
    const nodes = document.querySelectorAll('.im-cursor');
    nodes.forEach((n, i) => { 
      if (i < nodes.length - 1) n.remove(); 
    });
  }, []);
  
  return enabled;
}