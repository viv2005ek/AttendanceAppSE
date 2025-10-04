// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDGJ3Vnoo6knzrO9YAJyQBh4NRsPmW71oY",
  authDomain: "attendme-8f8ea.firebaseapp.com",
  projectId: "attendme-8f8ea",
  storageBucket: "attendme-8f8ea.firebasestorage.app",
  messagingSenderId: "429310630347",
  appId: "1:429310630347:web:9ad498999a97cfe72c3e4e",
  measurementId: "G-49Z6WDHNRP"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;