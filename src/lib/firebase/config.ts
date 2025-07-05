
// This file configures and initializes the Firebase application instance.
// It reads the configuration from environment variables and exports the initialized auth and firestore services.
// NOTE: This setup ensures Firebase is initialized only once, preventing common errors.

import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration, sourced from environment variables.
// It's crucial that these are prefixed with NEXT_PUBLIC_ to be accessible on the client side.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- Firebase Initialization ---

// Check if a Firebase app has already been initialized. If not, initialize it.
// This is a standard pattern to prevent re-initialization on hot reloads in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- Service Exports ---

// Export the authentication service, making it available for use throughout the application.
export const auth = getAuth(app);

// Export the Firestore database service.
export const db = getFirestore(app);

// Export a provider instance for Google Sign-In.
export const googleProvider = new GoogleAuthProvider();


// --- Startup Verification Log ---
// This log helps confirm that the Firebase config is being loaded correctly.
// It runs on both the server and the client to help with debugging.
const logConfigVerification = () => {
    const context = typeof window === 'undefined' ? 'SERVER' : 'CLIENT';
    console.log(`\n--- Firebase Config Verification (${context}) ---`);
    if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
      console.log(`✅ Project ID: ${firebaseConfig.projectId}`);
      console.log(`✅ Auth Domain: ${firebaseConfig.authDomain}`);
      console.log("%c-> CRITICAL: For Google Sign-In to work, you MUST add the following domains to your Firebase project's 'Authorized domains' list:", "color: yellow; font-weight: bold;");
      console.log(`   1. The Auth Domain itself: %c${firebaseConfig.authDomain}`, "color: lightblue;");
      if (typeof window !== 'undefined') {
        console.log(`   2. Your app's current domain: %c${window.location.hostname}`, "color: lightblue;");
        console.log("   (If running locally, you might also need to add 'localhost')");
      }
      console.log("   Failure to do so will cause the sign-in popup to close immediately with an 'auth/popup-closed-by-user' or 'auth/unauthorized-domain' error.");
    } else {
      console.error("❌ CRITICAL: Firebase config is MISSING from your .env file!");
      console.error("   Please ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_API_KEY are set.");
    }
    console.log("----------------------------------------\n");
};

// We want to log this once on the server and once on the client to aid debugging.
if (typeof window === 'undefined') {
    logConfigVerification();
} else {
    // A bit of a trick to ensure the client-side log only runs once.
    if (!(window as any).__firebaseConfigLogged) {
        logConfigVerification();
        (window as any).__firebaseConfigLogged = true;
    }
}
