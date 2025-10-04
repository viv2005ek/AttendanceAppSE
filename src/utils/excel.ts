// utils/excel.ts
import * as XLSX from 'xlsx';
import { AttendanceRecord, StudentData } from '../types';

/**
 * Import students from Excel/CSV file
 * @param file - File object (Excel or CSV)
 * @returns Array of student data
 */
export const importStudentsFromExcel = async (file: File): Promise<StudentData[]> => {
  try {
    console.log('Importing students from file:', file.name, file.type);

    if (!file) {
      throw new Error('No file provided');
    }

    // Check file type
    const isExcel = file.name.match(/\.(xlsx|xls)$/i);
    const isCSV = file.name.match(/\.(csv)$/i) || file.type === 'text/csv';

    if (!isExcel && !isCSV) {
      throw new Error('Please upload an Excel (.xlsx, .xls) or CSV file');
    }

    let students: StudentData[] = [];

    if (isExcel) {
      students = await parseExcelFile(file);
    } else if (isCSV) {
      students = await parseCSVFile(file);
    }

    // Validate imported data
    if (students.length === 0) {
      throw new Error('No valid student records found in the file');
    }

    console.log(`Successfully imported ${students.length} students`);
    return students;
  } catch (error) {
    console.error('Error importing students from Excel:', error);
    throw error;
  }
};

/**
 * Parse Excel file and extract student data
 * @param file - Excel file
 * @returns Array of student data
 */
const parseExcelFile = async (file: File): Promise<StudentData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('File is empty or has no data rows');
        }

        const students = parseSheetData(jsonData);
        resolve(students);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse CSV file and extract student data
 * @param file - CSV file
 * @returns Array of student data
 */
const parseCSVFile = async (file: File): Promise<StudentData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file is empty or has no data rows');
        }

        // Parse CSV lines
        const jsonData = lines.map(line => {
          // Handle quoted fields and commas within values
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const fields: string[] = [];
          let match;

          while ((match = regex.exec(line)) !== null) {
            let field = match[1];
            if (field.startsWith('"') && field.endsWith('"')) {
              field = field.slice(1, -1).replace(/""/g, '"');
            }
            fields.push(field.trim());
          }

          return fields;
        });

        const students = parseSheetData(jsonData);
        resolve(students);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
};

/**
 * Parse sheet data and extract student information
 * @param data - 2D array of sheet data
 * @returns Array of student data
 */
const parseSheetData = (data: any[][]): StudentData[] => {
  const students: StudentData[] = [];
  
  if (data.length === 0) {
    return students;
  }

  const headers = data[0].map((header: any) => 
    header?.toString().toLowerCase().trim() || ''
  );

  // Find relevant column indices
  const nameIndices = headers.flatMap((header, index) => 
    header.includes('name') || header.includes('student') || header.includes('fullname') ? [index] : []
  );
  
  const regIndices = headers.flatMap((header, index) =>
    header.includes('reg') || header.includes('registration') || 
    header.includes('roll') || header.includes('id') || 
    header.includes('number') || header.includes('code') ? [index] : []
  );

  const nameIndex = nameIndices[0] ?? 0;
  const regIndex = regIndices[0] ?? (nameIndex === 0 ? 1 : 0);

  console.log('Detected columns:', { nameIndex, regIndex, headers });

  // Process data rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const name = (row[nameIndex]?.toString().trim() || '').replace(/^\s+|\s+$/g, '');
    const registrationNumber = (row[regIndex]?.toString().trim() || '').replace(/^\s+|\s+$/g, '');

    // Validate required fields
    if (name && registrationNumber) {
      // Additional validation
      if (name.length < 2 || name.length > 100) {
        console.warn(`Invalid name length for: ${name}`);
        continue;
      }

      if (registrationNumber.length < 3 || registrationNumber.length > 50) {
        console.warn(`Invalid registration number length for: ${registrationNumber}`);
        continue;
      }

      students.push({
        name,
        registrationNumber
      });
    }
  }

  // Remove duplicates based on registration number
  const uniqueStudents = students.filter((student, index, self) =>
    index === self.findIndex(s => 
      s.registrationNumber.toLowerCase() === student.registrationNumber.toLowerCase()
    )
  );

  return uniqueStudents;
};

/**
 * Export attendance data to Excel
 * @param attendanceRecords - Array of attendance records
 * @param sessionInfo - Session information
 */
export const exportAttendanceToExcel = (
  attendanceRecords: AttendanceRecord[],
  sessionInfo: {
    sessionId: string;
    facultyName: string;
    date: Date;
  }
): void => {
  try {
    // Prepare data for Excel
    const excelData = attendanceRecords.map(record => ({
      'Student Name': record.studentName,
      'Registration Number': record.registrationNumber,
      'Status': formatStatus(record.finalStatus),
      'Overlap Percentage': `${record.overlapPercentage?.toFixed(1)}%`,
      'Time': record.timestamp.toLocaleString(),
      'Location Match': getLocationMatchText(record.overlapPercentage),
      'Faculty Override': record.facultyOverride ? 'Yes' : 'No'
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add session info as first rows
    const infoData = [
      ['Session Information', ''],
      ['Session ID', sessionInfo.sessionId],
      ['Faculty Name', sessionInfo.facultyName],
      ['Session Date', sessionInfo.date.toLocaleDateString()],
      ['Export Date', new Date().toLocaleDateString()],
      ['Total Records', attendanceRecords.length],
      ['', ''], // Empty row for spacing
      ['Attendance Records', '']
    ];

    XLSX.utils.sheet_add_aoa(ws, infoData, { origin: 'A1' });

    // Add headers after info
    const headers = Object.keys(excelData[0] || {});
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A9' });

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    // Set column widths for better readability
    if (!ws['!cols']) {
      ws['!cols'] = [
        { wch: 20 }, // Student Name
        { wch: 20 }, // Registration Number
        { wch: 15 }, // Status
        { wch: 15 }, // Overlap Percentage
        { wch: 25 }, // Time
        { wch: 15 }, // Location Match
        { wch: 15 }, // Faculty Override
      ];
    }

    // Generate filename
    const fileName = `attendance_${sessionInfo.sessionId}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Export to file
    XLSX.writeFile(wb, fileName);
    
    console.log(`Exported ${attendanceRecords.length} records to ${fileName}`);
  } catch (error) {
    console.error('Error exporting attendance to Excel:', error);
    throw new Error('Failed to export attendance data');
  }
};

/**
 * Download sample student template
 */
export const downloadSampleTemplate = (): void => {
  // Create sample data
  const sampleData = [
    ['Student Name', 'Registration Number'],
    ['John Doe', '2023001'],
    ['Jane Smith', '2023002'],
    ['Raj Kumar', '2023003'],
    ['Priya Sharma', '2023004'],
    ['Amit Patel', '2023005'],
    ['Sneha Gupta', '2023006'],
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Student Name
    { wch: 20 }, // Registration Number
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  
  // Add instructions sheet
  const instructions = [
    ['Instructions for Student Data Import'],
    [''],
    ['1. Required Columns:'],
    ['   - Student Name: Full name of the student'],
    ['   - Registration Number: Unique identifier for the student'],
    [''],
    ['2. Column Names:'],
    ['   - You can use any column names, the system will automatically detect'],
    ['   - Common names for Student Name: Name, Student Name, Full Name'],
    ['   - Common names for Registration Number: Registration, Reg No, Roll No, ID'],
    [''],
    ['3. File Format:'],
    ['   - Excel (.xlsx, .xls) or CSV files are supported'],
    ['   - First row should contain column headers'],
    ['   - Maximum 1000 students per file'],
    [''],
    ['4. Data Validation:'],
    ['   - Student Name: 2-100 characters'],
    ['   - Registration Number: 3-50 characters'],
    ['   - Duplicate registration numbers will be removed'],
    [''],
    ['5. Sample Data:'],
    ['   - Fill in your actual student data below the header row'],
    ['   - Delete the sample data before uploading your actual data'],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
  
  // Export to file
  XLSX.writeFile(wb, 'student_template.xlsx');
};

/**
 * Format status for display
 * @param status - Attendance status
 * @returns Formatted status text
 */
const formatStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    present: 'Present',
    check: 'Please Check',
    proxy: 'Proxy',
    not_in_list: 'Not in List',
  };
  
  return statusMap[status] || status;
};

/**
 * Get location match description
 * @param overlapPercentage - Overlap percentage
 * @returns Location match text
 */
const getLocationMatchText = (overlapPercentage: number): string => {
  if (overlapPercentage >= 70) return 'Excellent';
  if (overlapPercentage >= 40) return 'Moderate';
  return 'Poor';
};

/**
 * Validate student data
 * @param students - Array of student data
 * @returns Validation result
 */
export const validateStudentData = (students: StudentData[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (students.length === 0) {
    errors.push('No student data found');
    return { isValid: false, errors };
  }

  if (students.length > 1000) {
    errors.push('Too many students. Maximum 1000 students per file.');
  }

  students.forEach((student, index) => {
    if (!student.name || student.name.trim().length < 2) {
      errors.push(`Row ${index + 1}: Student name is too short or empty`);
    }
    
    if (!student.registrationNumber || student.registrationNumber.trim().length < 3) {
      errors.push(`Row ${index + 1}: Registration number is too short or empty`);
    }
  });

  // Check for duplicates
  const regNumbers = students.map(s => s.registrationNumber.toLowerCase());
  const duplicates = regNumbers.filter((num, index) => regNumbers.indexOf(num) !== index);
  
  if (duplicates.length > 0) {
    errors.push(`Duplicate registration numbers found: ${Array.from(new Set(duplicates)).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  importStudentsFromExcel,
  exportAttendanceToExcel,
  downloadSampleTemplate,
  validateStudentData,
};