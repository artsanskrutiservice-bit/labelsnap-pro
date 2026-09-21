import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB6N9Jx6YF9WFENmAuf17T2T85TgqH0yIA",
  authDomain: "labelsnap-pro.firebaseapp.com",
  databaseURL: "https://labelsnap-pro-default-rtdb.firebaseio.com",
  projectId: "labelsnap-pro",
  storageBucket: "labelsnap-pro.firebasestorage.app",
  messagingSenderId: "700839509546",
  appId: "1:700839509546:web:e912c7cbad9edc241d4d53",
  measurementId: "G-WGR7L2G8T5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);