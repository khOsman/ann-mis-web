// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2UaEJbt86o8ghdGJ04Z7N7pOTMhgCEdE",
  authDomain: "ann-data-warehouse.firebaseapp.com",
  projectId: "ann-data-warehouse",
  storageBucket: "ann-data-warehouse.firebasestorage.app",
  messagingSenderId: "797692464906",
  appId: "1:797692464906:web:b198ae88e26f4b95cb74f3"
};

// Tabs opened for the "log in as" impersonation flow (/session) get their
// own named Firebase app instance. Firebase keys its persisted auth state
// by app name, so this keeps that tab's sign-in completely isolated from
// the admin's own session in every other tab — all of which share the
// default ("[DEFAULT]") app below.
const isImpersonationTab =
  typeof window !== "undefined" &&
  window.location.pathname === "/session";

// Initialize Firebase
const app = initializeApp(
  firebaseConfig,
  isImpersonationTab ? "impersonation" : undefined
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Plain WebSocket-based streaming (Firestore's default) gets silently
// dropped by a lot of mobile carrier networks, corporate/school wifi, and
// in-app browsers (e.g. opening the public registration link from inside
// the Facebook/Instagram app) — the connection looks "offline" and every
// write (including the registration transaction) fails, while the exact
// same page works fine on a laptop's less-restricted network. Auto-detecting
// long-polling falls back to plain HTTP when streaming isn't viable, which
// works everywhere streaming does plus the networks that block it.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});