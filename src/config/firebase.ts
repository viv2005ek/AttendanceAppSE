// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBruyg2ehkiGRtJKQD626DtWojPt3wLAXs",
  authDomain: "attendance-app-se-1a68b.firebaseapp.com",
  projectId: "attendance-app-se-1a68b",
  storageBucket: "attendance-app-se-1a68b.firebasestorage.app",
  messagingSenderId: "783682970107",
  appId: "1:783682970107:web:e79bc1cc5e399d8eecab5e",
  measurementId: "G-FQBTV0VRSR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;