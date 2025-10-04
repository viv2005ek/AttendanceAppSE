// Authentication service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const signUp = async (
  email: string,
  password: string,
  userData: Omit<User, 'uid' | 'createdAt'>
): Promise<User> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    const newUser: User = {
      uid: user.uid,
      email: user.email!,
      name: userData.name,
      registrationNumber: userData.registrationNumber,
      phoneNumber: userData.phoneNumber,
      role: userData.role,
      createdAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', user.uid), newUser);
    return newUser;
  } catch (error: any) {
    throw new Error(error.message || 'Sign up failed');
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    return userDoc.data() as User;
  } catch (error: any) {
    throw new Error(error.message || 'Sign in failed');
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Sign out failed');
  }
};

export const getCurrentUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    return userDoc.exists() ? userDoc.data() as User : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await getCurrentUser(firebaseUser);
      callback(user);
    } else {
      callback(null);
    }
  });
};