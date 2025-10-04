// TypeScript type definitions
export interface User {
  uid: string;
  email: string;
  name: string;
  registrationNumber: string;
  phoneNumber: string;
  role: 'faculty' | 'student';
  createdAt: Date;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Session {
  id: string;
  sessionId: string;
  facultyId: string;
  facultyName: string;
  coordinates: Coordinates;
  radius: number;
  roomSize: 'small' | 'mid' | 'large';
  correctnessRange: number;
  activeDuration: number;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired';
  studentList: StudentData[];
}

export interface StudentData {
  studentName: string;
  registrationNumber: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  timestamp: Date;
  studentCoords: Coordinates;
  overlapPercentage: number;
  status: 'present' | 'check' | 'proxy' | 'not_in_list';
  facultyOverride: boolean;
  finalStatus: string;
}

export interface RoomSizeConfig {
  small: number;
  mid: number;
  large: number;
}