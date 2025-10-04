// types/index.ts
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

// Constants
export const ROOM_SIZES: RoomSizeConfig = {
  small: 5,
  mid: 10,
  large: 15
};

export const STATUS_COLORS = {
  present: '#10B981', // Green
  check: '#F59E0B',   // Yellow
  proxy: '#EF4444',   // Red
  not_in_list: '#DC2626' // Dark Red
};

export const ATTENDANCE_STATUS_LABELS = {
  present: 'Present',
  check: 'Please Check',
  proxy: 'Proxy',
  not_in_list: 'Not in List'
};