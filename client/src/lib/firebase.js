// Firebase configuration for the frontend client
// Note: Firebase credentials are stored in server/.env
// All Firebase operations (Firestore, Storage) are proxied through the server API
// This client config is for potential future client-side Firebase features

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration - values should match server/.env
// These can also be provided via a server API endpoint for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Initialize Firebase app (only if config is provided)
let app = null;
let db = null;
let storage = null;

const initializeFirebase = () => {
  if (!app && firebaseConfig.apiKey) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      storage = getStorage(app);
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.warn("Firebase initialization failed:", error.message);
    }
  }
  return { app, db, storage };
};

// Export initialization function and services
export const getFirebaseServices = () => initializeFirebase();

export { db, storage };
export default app;
