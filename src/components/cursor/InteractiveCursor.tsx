'use client';

import { motion, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useCursorSingleton } from '@/hooks/useCursorSingleton';

const xy = { stiffness: 560, damping: 40, mass: 0.6 };
const wh = { stiffness: 360, damping: 30, mass: 0.6 };
const op = { stiffness: 300, damping: 28 };
const sc = { stiffness: 500, damping: 35 };

export default function InteractiveCursor() {
  const active = useCursorSingleton();
  const [mode, setMode] = useState<'free' | 'hover' | 'surround'>('free');
  const targetRef = useRef<HTMLElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const x = useSpring(0, xy);
  const y = useSpring(0, xy);
  const w = useSpring(36, wh);
  const h = useSpring(36, wh);
  const r = useSpring(999, wh);
  const a = useSpring(0, op);
  const s = useSpring(1, sc); // click pulse scale

  function getVar(name: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(name);
  }

  // Helper function to check if element is actually clickable
  function isElementClickable(el: HTMLElement): boolean {
    // Check if element or its children have click handlers
    const hasOnClick = el.onclick !== null || el.getAttribute('onclick') !== null;
    
    // Check if it's a naturally clickable element
    const isNativelyClickable = el.matches('button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"], input[type="reset"]');
    
    // Check if it's disabled
    const isDisabled = el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true';
    
    // Check if it has cursor pointer in computed styles (indicates clickable)
    const computedStyle = window.getComputedStyle(el);
    const hasCursorPointer = computedStyle.cursor === 'pointer';
    
    return (hasOnClick || isNativelyClickable || hasCursorPointer) && !isDisabled;
  }

  useEffect(() => {
    if (!active) return;

    // Initialize with CSS variables
    const base = parseFloat(getVar('--cursor-size')) || 36;
    w.set(base);
    h.set(base);

    const onMove = (e: PointerEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      x.set(e.clientX);
      y.set(e.clientY);
      a.set(1);
    };

    // Click pulse
    const down = () => s.set(0.92);
    const up = () => s.set(1);

    const idleArm = () => {
      window.clearTimeout((idleArm as any)._t);
      (idleArm as any)._t = window.setTimeout(() => a.set(0), 2200);
    };

    const clearRO = () => {
      roRef.current?.disconnect();
      roRef.current = null;
    };

    const resetFree = () => {
      clearRO();
      targetRef.current = null;
      setMode('free');
      const base = parseFloat(getVar('--cursor-size')) || 36;
      w.set(base);
      h.set(base);
      r.set(999);
      // Keep cursor at last known mouse position, don't reset x,y
    };

    const updateToRect = (el: HTMLElement, pad: number, rounded: boolean) => {
      targetRef.current = el;
      // Observe resize for collapses/expands
      clearRO();
      roRef.current = new ResizeObserver(() => positionTo(el, pad, rounded));
      roRef.current.observe(el);
      positionTo(el, pad, rounded);
    };

    const positionTo = (el: HTMLElement, pad: number, rounded: boolean) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      x.set(cx);
      y.set(cy);
      w.set(rect.width + pad * 2);
      h.set(rect.height + pad * 2);
      
      if (rounded) {
        r.set(999);
      } else {
        const base = parseFloat(getComputedStyle(el).borderTopLeftRadius || '0');
        const minR = parseFloat(getVar('--cursor-radius-min')) || 16;
        r.set(Math.max(minR, base + pad));
      }
    };

    const onOver = (e: Event) => {
      const t = e.target as HTMLElement;
      
      // Never override native in text fields or opted elements
      if (t.closest('input,textarea,[contenteditable],[data-native-cursor]')) {
        resetFree();
        return;
      }

      // BUTTON morph (tight) - only for actually clickable buttons
      const btn = t.closest("button, [role='button'], a.button, .btn-primary, [data-cursor='button']") as HTMLElement | null;
      if (btn && isElementClickable(btn)) {
        setMode('hover');
        updateToRect(btn, parseFloat(getVar('--cursor-pad-button')) || 8, true);
        return;
      }

      // SURROUND morph (opt-in cards/tiles) - only for clickable elements
      const card = t.closest("[data-cursor='surround']") as HTMLElement | null;
      if (card && isElementClickable(card)) {
        setMode('surround');
        updateToRect(card, parseFloat(getVar('--cursor-pad-card')) || 12, false);
        return;
      }

      // Check for generic clickable elements (links, buttons without explicit data attributes)
      const clickable = t.closest('a, button, [role="button"], [role="link"]') as HTMLElement | null;
      if (clickable && isElementClickable(clickable) && !clickable.closest('[data-cursor="surround"]')) {
        setMode('hover');
        updateToRect(clickable, parseFloat(getVar('--cursor-pad-button')) || 8, true);
        return;
      }

      resetFree();
    };

    const onOut = (e: Event) => {
      // Only reset if we're actually leaving the targeted element
      const t = e.target as HTMLElement;
      if (targetRef.current && t === targetRef.current) {
        resetFree();
      }
    };
    
    const onEnter = () => a.set(1);
    const onLeave = () => a.set(0);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, true);
    document.addEventListener('pointerout', onOut, true);
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('focus', onEnter);
    window.addEventListener('blur', onLeave);
    document.addEventListener('mousemove', idleArm, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver, true);
      document.removeEventListener('pointerout', onOut, true);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('focus', onEnter);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('mousemove', idleArm);
      clearRO();
    };
  }, [active, x, y, w, h, r, a, s]);

  if (!active) return null;

  return (
    <motion.div 
      className="im-cursor fixed left-0 top-0 pointer-events-none z-[9999]"
      style={{ x, y, opacity: a, scale: s }}
    >
      <motion.div 
        className="im-cursor-ring -translate-x-1/2 -translate-y-1/2"
        style={{ width: w, height: h, borderRadius: r }}
      />
    </motion.div>
  );
}