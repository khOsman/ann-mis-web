// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2UaEJbt86o8ghdGJ04Z7N7pOTMhgCEdE",
  authDomain: "ann-data-warehouse.firebaseapp.com",
  projectId: "ann-data-warehouse",
  storageBucket: "ann-data-warehouse.firebasestorage.app",
  messagingSenderId: "797692464906",
  appId: "1:797692464906:web:b198ae88e26f4b95cb74f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);