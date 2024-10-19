import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "socialapp-e1c24.firebaseapp.com",
  projectId: "socialapp-e1c24",
  storageBucket: "socialapp-e1c24.appspot.com",
  messagingSenderId: "663852777092",
  appId: "1:663852777092:web:1879783178bcd7633fccd1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// AUNTHECATION 
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

// DATABASE
export const db=getFirestore();

// STORAGE FOR STORING IMAGES
export const storage=getStorage();
