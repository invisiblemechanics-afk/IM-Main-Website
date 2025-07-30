// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Read config values from Vite environment variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';

// Validate required environment variables
if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
  console.error('Missing one or more VITE_FIREBASE_* variables');
  throw new Error('Firebase config missing');
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize and export services
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Analytics only in production and handle blocking gracefully
export let analytics: ReturnType<typeof getAnalytics> | null = null;
(async (): Promise<void> => {
  try {
    // Only initialize analytics in production to avoid ad-blocker issues in development
    if (import.meta.env.PROD && await isSupported()) {
      analytics = getAnalytics(app);
      console.log('📊 Firebase Analytics initialized');
    } else {
      console.log('📊 Firebase Analytics skipped (development mode)');
    }
  } catch (error) {
    console.warn('📊 Firebase Analytics initialization failed (likely blocked by ad-blocker):', error);
    // Continue without analytics - this is non-critical
  }
})();

// Connect emulators in development
if (useEmulator) {
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
}