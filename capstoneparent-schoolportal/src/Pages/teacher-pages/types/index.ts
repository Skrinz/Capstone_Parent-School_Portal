export interface ClassItem {
  clist_id: number;
  gl_id: number;
  section_id: number;
  class_adviser: number;
  syear_start: number;
  syear_end: number;
  grade_level?: { grade_level: string };
  section?: { section_name: string };
  // For UI compatibility, I'll keep the flattened properties but update nomenclature
  grade?: string; // Mapped from grade_level.grade_level
  section_name?: string; // Mapped from section.section_name
  student_count?: number;
}

export interface SubjectItem {
  srecord_id: number;
  subject_name: string;
  time_start: string;
  time_end: string;
  subject_teacher?: number | null;
  studentCount?: number;
  classListIds?: number[];
  // For UI list filtering
  grade?: string; 
  section?: string;
  syear_start?: number;
  syear_end?: number;
}

// Student interface
export interface Student {
  student_id: number;
  fname: string;
  lname: string;
  name?: string; // Mapped: `${fname} ${lname}`
  lrn_number: string;
  lrn?: string; // Alias for UI
  sex: string;
  gl_id: number;
  syear_start: number;
  syear_end: number;
  schoolYear: string;     // Mapped: `${syear_start} - ${syear_end}`
  gradeSection: string;   // Mapped from relations
  finalAvgGrade: number | string;
  remarks: string;
  
  // Subject grades with all quarters
  subject_records?: SubjectGrade[]; // Renamed from subjectGrades
  
  // Attendance records
  attendance_records?: AttendanceRecord[]; // Renamed and changed to array
}

// Student subjects grades interface
export interface SubjectGrade {
  srs_id: number;
  srecord_id: number;
  student_id: number;
  subject_name?: string; // Mapped from subject record
  q1_grade?: number;
  q2_grade?: number;
  q3_grade?: number;
  q4_grade?: number;
  avg_grade: number | string;
  remarks: string; // PASSED/FAILED
  subject_record?: {
    class_lists?: Array<{
      clist_id: number;
    }>;
  };
}

// Attendance data structure
export interface AttendanceRecord {
  attendance_id: number;
  student_id: number;
  school_days: number;
  days_present: number;
  days_absent: number;
  month: string; // Enum: Jun, Jul...
}

export interface MonthAttendance {
  school_days: number;
  days_present: number;
  days_absent: number;
}

// For backward compatibility with ClassSummary
export interface QuarterGrades {
  subjects: {
    Filipino?: number;
    English?: number;
    Math?: number;
    Science?: number;
    AP?: number;
    GMRC?: number;
    EPP?: number;
    MAPEH?: number;
  };
  average: number;
  passed: boolean;
}

export interface ClassSummaryProps {
  students: Student[];
}

export interface QuarterStats {
  quarter: string;
  passingRate: number;
  totalStudents: number;
  passedStudents: number;
  color: string;
}

export interface SubjectAverage {
  subject: string;
  average: number;
  fullMark: number;
}

// Props for StudentGrades component
export interface StudentGradesProps {
  student: Student;
  onBack: () => void;
  subjectFilter?: {
    srecord_id: number;
    subject_name: string;
  };
}
