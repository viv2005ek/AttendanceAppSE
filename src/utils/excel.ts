// Excel import/export utilities
import * as XLSX from 'xlsx';
import { StudentData, AttendanceRecord } from '../types';

export const importStudentsFromExcel = (file: File): Promise<StudentData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const students: StudentData[] = jsonData.map((row: any) => ({
          studentName: row.studentName || row['Student Name'] || row.name || '',
          registrationNumber: row.registrationNumber || row['Registration Number'] || row.regNo || '',
        })).filter(student => student.studentName && student.registrationNumber);
        
        if (students.length === 0) {
          reject(new Error('No valid student data found. Please ensure columns are named "studentName" and "registrationNumber"'));
          return;
        }
        
        resolve(students);
      } catch (error) {
        reject(new Error('Error parsing Excel file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportAttendanceToExcel = (
  attendanceRecords: AttendanceRecord[],
  sessionInfo: { sessionId: string; facultyName: string; date: Date }
) => {
  const data = attendanceRecords.map(record => ({
    'Student Name': record.studentName,
    'Registration Number': record.registrationNumber,
    'Status': record.finalStatus,
    'Timestamp': record.timestamp.toLocaleString(),
    'Overlap Percentage': `${record.overlapPercentage.toFixed(1)}%`,
    'Faculty Override': record.facultyOverride ? 'Yes' : 'No',
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Add session info at the top
  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Session ID: ${sessionInfo.sessionId}`],
    [`Faculty: ${sessionInfo.facultyName}`],
    [`Date: ${sessionInfo.date.toLocaleDateString()}`],
    [''],
  ], { origin: 'A1' });
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  
  const filename = `attendance_${sessionInfo.sessionId}_${sessionInfo.date.toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};