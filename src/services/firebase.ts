// ─── Firebase Initialisation & Google OAuth ───────────────────────────────────
// Uses the modular Firebase v9+ SDK for minimum bundle size.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyBe-S4ShiDO9Cxwrwfx_eJzau_6yDzUV9U',
  authDomain: 'oceanembed-1b65a.firebaseapp.com',
  projectId: 'oceanembed-1b65a',
  storageBucket: 'oceanembed-1b65a.firebasestorage.app',
  messagingSenderId: '7036925970',
  appId: '1:7036925970:web:de51992ec129aabba340cb',
  measurementId: 'G-4HBJX9E3FY',
};

// ─── App, Auth & Analytics ────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);

// ─── Google Provider ──────────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
// Request email & profile scopes (default) and force account selection every time
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Opens the Google sign-in popup.
 * Returns the signed-in Firebase User on success.
 * Throws on cancellation or error.
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs the current user out of Firebase.
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Subscribes to Firebase auth state changes.
 * Returns the unsubscribe function.
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
