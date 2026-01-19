// Firebase Authentication Integration for React
// Provides utilities for getting ID tokens, handling token refresh, and auth state management

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getIdToken,
  getIdTokenResult,
} from "firebase/auth";

// Firebase configuration - import from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase Auth
let auth = null;
let app = null;

const initializeFirebaseAuth = () => {
  if (!app && firebaseConfig.apiKey) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      console.log("🔥 Firebase Auth initialized successfully");
    } catch (error) {
      console.warn("⚠️ Firebase Auth initialization failed:", error.message);
    }
  }
  return { app, auth };
};

// Get Firebase Auth instance
export const getFirebaseAuth = () => {
  if (!auth) {
    initializeFirebaseAuth();
  }
  return auth;
};

/**
 * Get the current user's ID token
 * This token can be used for Firebase-protected endpoints
 * @returns {Promise<string|null>} The ID token or null if not authenticated
 */
export async function getCurrentUserIdToken() {
  try {
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth || !firebaseAuth.currentUser) {
      console.warn("⚠️ No Firebase user logged in");
      return null;
    }

    // Force refresh to get a fresh token
    const token = await getIdToken(firebaseAuth.currentUser, true);
    console.log("✅ Got Firebase ID token:", token.substring(0, 20) + "...");
    return token;
  } catch (error) {
    console.error("❌ Error getting ID token:", error);
    return null;
  }
}

/**
 * Get ID token with claims
 * Useful for checking user roles and permissions
 * @returns {Promise<object|null>} Token result with claims or null
 */
export async function getIdTokenWithClaims() {
  try {
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth || !firebaseAuth.currentUser) {
      return null;
    }

    const tokenResult = await getIdTokenResult(firebaseAuth.currentUser);
    return {
      token: tokenResult.token,
      claims: tokenResult.claims,
      expirationTime: tokenResult.expirationTime,
      issuedAtTime: tokenResult.issuedAtTime,
    };
  } catch (error) {
    console.error("❌ Error getting token claims:", error);
    return null;
  }
}

/**
 * Check if token is expired or about to expire
 * @param {number} bufferSeconds - Buffer time before expiration (default: 300s = 5min)
 * @returns {boolean} True if token is expired or expiring soon
 */
export async function isTokenExpired(bufferSeconds = 300) {
  try {
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth || !firebaseAuth.currentUser) {
      return true;
    }

    const tokenResult = await getIdTokenResult(firebaseAuth.currentUser);
    const expirationTime = new Date(tokenResult.expirationTime).getTime();
    const currentTime = Date.now();
    const bufferMs = bufferSeconds * 1000;

    return expirationTime - currentTime < bufferMs;
  } catch (error) {
    console.error("❌ Error checking token expiration:", error);
    return true;
  }
}

/**
 * Force refresh the ID token
 * @returns {Promise<string|null>} New ID token or null
 */
export async function refreshToken() {
  try {
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth || !firebaseAuth.currentUser) {
      return null;
    }

    const newToken = await getIdToken(firebaseAuth.currentUser, true);
    console.log("🔄 Firebase token refreshed");
    return newToken;
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return null;
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Auth result with user data
 */
export async function signInWithEmail(email, password) {
  try {
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth) {
      throw new Error("Firebase Auth not initialized");
    }

    const userCredential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    const idToken = await getIdToken(userCredential.user, true);

    console.log("✅ Firebase sign-in successful:", userCredential.user.email);

    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      },
      idToken,
    };
  } catch (error) {
    console.error("❌ Firebase sign-in error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sign out from Firebase
 * @returns {Promise<boolean>} True if signed out successfully
 */
export async function signOut() {
  try {
    const firebaseAuth = getFirebaseAuth();
    if (!firebaseAuth) {
      return true;
    }

    await firebaseSignOut(firebaseAuth);
    console.log("✅ Firebase sign-out successful");
    return true;
  } catch (error) {
    console.error("❌ Firebase sign-out error:", error);
    return false;
  }
}

/**
 * Subscribe to auth state changes
 * @param {function} callback - Callback function receiving user or null
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    console.warn("⚠️ Firebase Auth not initialized");
    return () => {};
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    console.log("🔄 Auth state changed:", user ? user.email : "No user");
    callback(user);
  });
}

/**
 * Get user claims for permission checking
 * @returns {Promise<object>} User claims or empty object
 */
export async function getUserClaims() {
  try {
    const tokenResult = await getIdTokenWithClaims();
    return tokenResult?.claims || {};
  } catch (error) {
    console.error("❌ Error getting user claims:", error);
    return {};
  }
}

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @returns {Promise<boolean>} True if user has the role
 */
export async function hasRole(role) {
  const claims = await getUserClaims();
  return claims.role === role || claims.roles?.includes(role);
}

/**
 * Check if user is admin
 * @returns {Promise<boolean>} True if user is admin
 */
export async function isAdmin() {
  return hasRole("admin");
}

// Initialize on import
initializeFirebaseAuth();

export default {
  getFirebaseAuth,
  getCurrentUserIdToken,
  getIdTokenWithClaims,
  isTokenExpired,
  refreshToken,
  signInWithEmail,
  signOut,
  onAuthStateChange,
  getUserClaims,
  hasRole,
  isAdmin,
};
