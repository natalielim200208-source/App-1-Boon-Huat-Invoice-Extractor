import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = localStorage.getItem('bh_google_access_token');

export const initAuthListener = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const storedToken = localStorage.getItem('bh_google_access_token') || cachedAccessToken;
      if (storedToken) {
        cachedAccessToken = storedToken;
      }
      if (onAuthSuccess) onAuthSuccess(user, storedToken);
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('bh_google_access_token');
      localStorage.removeItem('bh_google_token_expiry');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token for Sheets integration.');
    }
    cachedAccessToken = credential.accessToken;
    const expiryTime = Date.now() + 3500 * 1000; // ~58 min token lifetime
    localStorage.setItem('bh_google_access_token', credential.accessToken);
    localStorage.setItem('bh_google_token_expiry', expiryTime.toString());
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Google Sign-In popup was blocked.');
      throw new Error(
        'Google Sign-In popup was blocked by browser or embedded iframe rules. Please allow popups or open the app in a new tab to authenticate.'
      );
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      console.warn('Google Sign-In popup closed by user.');
      throw new Error('Sign-in window was closed before completion. Please try again.');
    }
    console.error('Firebase Auth Sign-in error:', error);
    throw new Error(error?.message || 'Google Authentication failed.');
  } finally {
    isSigningIn = false;
  }
};

export const isTokenExpired = (): boolean => {
  const expiry = localStorage.getItem('bh_google_token_expiry');
  if (!expiry) return false;
  return Date.now() >= Number(expiry);
};

export const getAccessToken = async (): Promise<string | null> => {
  return localStorage.getItem('bh_google_access_token') || cachedAccessToken;
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const token = await getAccessToken();
  if (token && !isTokenExpired()) {
    return token;
  }
  // Token missing or expired — if user is signed in, prompt/refresh
  if (auth.currentUser) {
    console.log('[Auth Session] Access token missing or expired. Attempting refresh...');
    try {
      const res = await googleSignIn();
      return res?.accessToken || token;
    } catch (err) {
      console.warn('[Auth Session] Token refresh failed:', err);
      return token;
    }
  }
  return token;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem('bh_google_access_token', token);
    const expiryTime = Date.now() + 3500 * 1000;
    localStorage.setItem('bh_google_token_expiry', expiryTime.toString());
  } else {
    localStorage.removeItem('bh_google_access_token');
    localStorage.removeItem('bh_google_token_expiry');
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Sign-out error:', e);
  }
  cachedAccessToken = null;
  localStorage.removeItem('bh_google_access_token');
  localStorage.removeItem('bh_google_token_expiry');
  localStorage.removeItem('bh_google_sheet_id');
};
