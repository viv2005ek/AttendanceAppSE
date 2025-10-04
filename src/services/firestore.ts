/* eslint-disable @typescript-eslint/no-unused-vars */
// Firestore database operations - FIXED VERSION
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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Session, AttendanceRecord, StudentData } from '../types';

// Helper function to convert Firestore timestamps to Date objects
const convertSessionTimestamps = (doc: any): Session => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    expiresAt: data.expiresAt?.toDate() || new Date(),
  } as Session;
};

export const createSession = async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
  try {
    // Generate 6-digit session ID
    const sessionId = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + sessionData.activeDuration);

    const sessionDoc = {
      ...sessionData,
      sessionId,
      status: 'active' as const,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    const docRef = await addDoc(collection(db, 'sessions'), sessionDoc);
    
    return {
      id: docRef.id,
      ...sessionDoc,
      createdAt: new Date(),
      expiresAt,
    } as Session;
  } catch (error: any) {
    console.error('Error creating session:', error);
    throw new Error(`Failed to create session: ${error.message}`);
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
    return convertSessionTimestamps(doc);
  } catch (error: any) {
    console.error('Error getting session:', error);
    throw new Error(`Failed to get session: ${error.message}`);
  }
};

export const getFacultySessions = async (facultyId: string): Promise<Session[]> => {
  try {
    console.log('Fetching sessions for faculty:', facultyId);
    
    const q = query(
      collection(db, 'sessions'),
      where('facultyId', '==', facultyId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Found sessions:', querySnapshot.docs.length);
    
    const sessions = querySnapshot.docs.map(convertSessionTimestamps);
    console.log('Processed sessions:', sessions);
    
    return sessions;
  } catch (error: any) {
    console.error('Error in getFacultySessions:', error);
    throw new Error(`Failed to get sessions: ${error.message}`);
  }
};

// UPDATED: Remove the duplicate calculation and use the data from frontend
// services/firestore.ts - UPDATED markAttendance function
export const markAttendance = async (attendanceData: Omit<AttendanceRecord, 'id'>): Promise<string> => {
  try {
    console.log('Marking attendance with data:', attendanceData);

    // Validate and normalize coordinates
    const normalizedStudentCoords = normalizeCoordinates(attendanceData.studentCoords);
    
    if (!normalizedStudentCoords) {
      throw new Error('Invalid student coordinates provided');
    }

    // Validate that overlapPercentage is a number
    if (typeof attendanceData.overlapPercentage !== 'number' || isNaN(attendanceData.overlapPercentage)) {
      console.error('Invalid overlapPercentage:', attendanceData.overlapPercentage);
      throw new Error('Overlap percentage must be a valid number');
    }

    // Create the document with normalized data
    const attendanceDoc = {
      sessionId: String(attendanceData.sessionId),
      studentId: String(attendanceData.studentId),
      studentName: String(attendanceData.studentName),
      registrationNumber: String(attendanceData.registrationNumber),
      studentCoords: normalizedStudentCoords,
      overlapPercentage: Number(attendanceData.overlapPercentage),
      status: String(attendanceData.status) as 'present' | 'check' | 'proxy' | 'not_in_list',
      finalStatus: String(attendanceData.finalStatus) as 'present' | 'check' | 'proxy' | 'not_in_list',
      facultyOverride: Boolean(attendanceData.facultyOverride),
      timestamp: serverTimestamp(),
    };

    console.log('Submitting to Firestore:', attendanceDoc);

    const docRef = await addDoc(collection(db, 'attendance'), attendanceDoc);
    console.log('Attendance marked successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    throw new Error(`Failed to mark attendance: ${error.message}`);
  }
};

// Add this helper function to normalize coordinates
const normalizeCoordinates = (coords: any): { latitude: number; longitude: number } | null => {
  try {
    if (!coords) {
      console.error('Coordinates are null or undefined');
      return null;
    }

    // Handle different coordinate formats
    let lat: number, lng: number;

    if (typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      lat = coords.latitude;
      lng = coords.longitude;
    } else if (typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      lat = coords.lat;
      lng = coords.lng;
    } else if (typeof coords.lat === 'string' && typeof coords.lng === 'string') {
      lat = parseFloat(coords.lat);
      lng = parseFloat(coords.lng);
    } else if (typeof coords.latitude === 'string' && typeof coords.longitude === 'string') {
      lat = parseFloat(coords.latitude);
      lng = parseFloat(coords.longitude);
    } else {
      console.error('Invalid coordinate format:', coords);
      return null;
    }

    // Validate coordinate ranges
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Coordinates out of valid range:', { lat, lng });
      return null;
    }

    return {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6))
    };
  } catch (error) {
    console.error('Error normalizing coordinates:', error);
    return null;
  }
};

// REMOVED: The duplicate calculateOverlapPercentage function since it's already in the frontend

// Keep the distance calculation helper for other uses
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const getSessionAttendance = async (sessionId: string): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, 'attendance'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as AttendanceRecord;
    });
  } catch (error: any) {
    console.error('Error getting attendance records:', error);
    throw new Error(`Failed to get attendance records: ${error.message}`);
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
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating attendance status:', error);
    throw new Error(`Failed to update attendance status: ${error.message}`);
  }
};

export const subscribeToSessionAttendance = (
  sessionId: string,
  callback: (attendance: AttendanceRecord[]) => void
) => {
  const q = query(
    collection(db, 'attendance'),
    where('sessionId', '==', sessionId),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const attendance = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as AttendanceRecord;
    });
    
    callback(attendance);
  });
};

export const updateSessionStatus = async (sessionId: string, status: 'active' | 'expired'): Promise<void> => {
  try {
    const q = query(collection(db, 'sessions'), where('sessionId', '==', sessionId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { 
        status,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error: any) {
    console.error('Error updating session status:', error);
    throw new Error(`Failed to update session status: ${error.message}`);
  }
};

// Auto-expire sessions
export const checkAndExpireSessions = async (): Promise<void> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, 'sessions'),
      where('status', '==', 'active'),
      where('expiresAt', '<=', Timestamp.fromDate(now))
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, { 
        status: 'expired',
        updatedAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
    console.log(`Expired ${updatePromises.length} sessions`);
  } catch (error: any) {
    console.error('Error expiring sessions:', error);
  }
};

// Student management functions
export const importStudentList = async (facultyId: string, students: StudentData[]): Promise<void> => {
  try {
    const studentListDoc = {
      facultyId,
      students,
      importedAt: serverTimestamp(),
      studentCount: students.length,
    };
    
    await addDoc(collection(db, 'studentLists'), studentListDoc);
  } catch (error: any) {
    console.error('Error importing student list:', error);
    throw new Error(`Failed to import student list: ${error.message}`);
  }
};

export const getFacultyStudentList = async (facultyId: string): Promise<StudentData[]> => {
  try {
    const q = query(
      collection(db, 'studentLists'),
      where('facultyId', '==', facultyId),
      orderBy('importedAt', 'desc'),
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return [];
    }
    
    const latestList = querySnapshot.docs[0].data();
    return latestList.students || [];
  } catch (error: any) {
    console.error('Error getting student list:', error);
    throw new Error(`Failed to get student list: ${error.message}`);
  }
};

// Application constants and configurations
export const ROOM_SIZES: { [key: string]: number } = {
  small: 5,
  mid: 10,
  large: 15,
};

export const CORRECTNESS_RANGE = 5; // Additional buffer in meters

export const ACTIVE_DURATIONS = [5, 10, 15]; // Minutes

export const OVERLAP_THRESHOLDS = {
  PRESENT: 70,
  CHECK_MIN: 40,
  CHECK_MAX: 70,
  PROXY: 40,
};

export const STATUS_COLORS = {
  present: '#10B981', // Green
  check: '#F59E0B',   // Yellow
  proxy: '#EF4444',   // Red
  not_in_list: '#EF4444', // Red
};

export const ATTENDANCE_STATUS_LABELS = {
  present: 'Present',
  check: 'Please Check',
  proxy: 'Proxy',
  not_in_list: 'Not in List',
};