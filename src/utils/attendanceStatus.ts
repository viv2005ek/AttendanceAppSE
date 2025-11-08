/**
 * Attendance status determination logic
 */

import { OVERLAP_THRESHOLDS } from './constants';

export type AttendanceStatus = 'present' | 'check' | 'proxy' | 'not_in_list';

/**
 * Determine attendance status based on overlap percentage
 */
export const determineAttendanceStatus = (
  overlapPercentage: number,
  isStudentInList: boolean
): AttendanceStatus => {
  if (!isStudentInList) {
    return 'not_in_list';
  }

  if (overlapPercentage >= OVERLAP_THRESHOLDS.PRESENT) {
    return 'present';
  }

  if (overlapPercentage >= OVERLAP_THRESHOLDS.CHECK_MIN) {
    return 'check';
  }

  return 'proxy';
};

/**
 * Check if student is in the session's student list
 */
export const isStudentInList = (
  studentRegNumber: string,
  studentList: Array<{ registrationNumber: string }>
): boolean => {
  if (!studentRegNumber || !studentList) return false;
  
  return studentList.some(
    student => student.registrationNumber.toLowerCase() === studentRegNumber.toLowerCase()
  );
};
