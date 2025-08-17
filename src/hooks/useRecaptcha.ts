import { useEffect, useRef, useState } from 'react';
import { RecaptchaVerifier, getAuth } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface UseRecaptchaReturn {
  recaptchaVerifier: RecaptchaVerifier | null;
  isReady: boolean;
  error: string | null;
  reset: () => void;
}

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

export function useRecaptcha(): UseRecaptchaReturn {
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);

  const initializeRecaptcha = () => {
    // Guard against server-side rendering and double initialization
    if (typeof window === 'undefined' || initializingRef.current) {
      return;
    }

    try {
      initializingRef.current = true;
      setError(null);

      // Check if container exists
      const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
      if (!container) {
        throw new Error('reCAPTCHA container not found');
      }

      // Clear any existing content
      container.innerHTML = '';

      // Create new RecaptchaVerifier with Firebase v9 syntax
      const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved - allow sign-in
          setIsReady(true);
        },
        'expired-callback': () => {
          // reCAPTCHA expired - reset
          setIsReady(false);
          setError('reCAPTCHA expired. Please try again.');
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          setError('reCAPTCHA error. Please try again.');
          setIsReady(false);
        }
      });

      setRecaptchaVerifier(verifier);
      setIsReady(true);
    } catch (err) {
      console.error('Failed to initialize reCAPTCHA:', err);
      setError('Failed to initialize reCAPTCHA. Please refresh the page.');
      setIsReady(false);
    } finally {
      initializingRef.current = false;
    }
  };

  const reset = () => {
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (err) {
        console.warn('Error clearing reCAPTCHA:', err);
      }
    }
    setRecaptchaVerifier(null);
    setIsReady(false);
    setError(null);
    initializingRef.current = false;
    
    // Reinitialize after a brief delay
    setTimeout(initializeRecaptcha, 100);
  };

  useEffect(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      initializeRecaptcha();
    }

    // Cleanup on unmount
    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (err) {
          console.warn('Error clearing reCAPTCHA on unmount:', err);
        }
      }
      initializingRef.current = false;
    };
  }, []);

  return {
    recaptchaVerifier,
    isReady,
    error,
    reset,
  };
}
