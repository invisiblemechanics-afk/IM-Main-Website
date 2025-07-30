import type { AuthMode } from '../types/auth';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

export async function handleGoogleAuth() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (err) {
    let message = (err as Error).message;

    // Friendly hint for the common case
    if (
      err instanceof FirebaseError &&
      err.code === 'auth/unauthorized-domain' &&
      typeof window !== 'undefined'
    ) {
      const host = window.location.hostname;
      
      // Check if we're in a WebContainer environment (Bolt/StackBlitz)
      if (host.includes('webcontainer') || host.includes('stackblitz') || host.includes('bolt')) {
        message = `Google Auth is not available in this development environment.\n\n` +
                  `This is because Bolt/WebContainer uses dynamic domains that can't be pre-authorized in Firebase.\n\n` +
                  `To test Google Auth:\n` +
                  `1. Download this project and run it locally\n` +
                  `2. Or use email/password authentication which works in all environments`;
      } else {
        message = `This domain (${host}) is not on Firebase's Authorized domains list.\n` +
                  `→ Fix: Firebase console → Authentication → Settings → Authorized domains → Add "${host}".`;
      }
    }

    return message;   // use existing error‑display mechanism
  }
}

export async function handleEmailPassword(
  mode: AuthMode,
  email: string,
  password: string
) {
  try {
    if (mode === 'signup') {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    window.location.href = '/dashboard';
  } catch (err) {
    return (err as Error).message;
  }
}