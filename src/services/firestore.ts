// Firestore database operations
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Session, AttendanceRecord, StudentData } from '../types';

export const createSession = async (sessionData: Omit<Session, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      ...sessionData,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(sessionData.expiresAt),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error('Failed to create session');
  }
};

export const getSessionBySessionId = async (sessionId: string): Promise<Session | null> => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('sessionId', '==', sessionId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Session;
  } catch (error) {
    throw new Error('Failed to get session');
  }
};

export const getFacultySessions = async (facultyId: string): Promise<Session[]> => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('facultyId', '==', facultyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Session[];
  } catch (error) {
    throw new Error('Failed to get sessions');
  }
};

export const markAttendance = async (attendanceData: Omit<AttendanceRecord, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'attendance'), {
      ...attendanceData,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error('Failed to mark attendance');
  }
};

export const getSessionAttendance = async (sessionId: string): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, 'attendance'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as AttendanceRecord[];
  } catch (error) {
    throw new Error('Failed to get attendance records');
  }
};

export const updateAttendanceStatus = async (
  attendanceId: string,
  newStatus: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'attendance', attendanceId), {
      finalStatus: newStatus,
      facultyOverride: true,
    });
  } catch (error) {
    throw new Error('Failed to update attendance status');
  }
};

export const subscribeToSessionAttendance = (
  sessionId: string,
  callback: (attendance: AttendanceRecord[]) => void
) => {
  const q = query(
    collection(db, 'attendance'),
    where('sessionId', '==', sessionId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const attendance = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    })) as AttendanceRecord[];
    
    callback(attendance);
  });
};

export const updateSessionStatus = async (sessionId: string, status: 'active' | 'expired'): Promise<void> => {
  try {
    const q = query(collection(db, 'sessions'), where('sessionId', '==', sessionId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { status });
    }
  } catch (error) {
    throw new Error('Failed to update session status');
  }
};