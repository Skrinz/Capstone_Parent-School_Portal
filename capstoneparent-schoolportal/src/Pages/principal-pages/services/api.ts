import type { SectionItem, TeacherItem } from '@/Pages/principal-pages/types';
import type { ClassItem, SubjectItem, Student } from '@/Pages/teacher-pages/types';

const API_BASE_URL = '/api';

// Sample sections data
const SAMPLE_SECTIONS: SectionItem[] = [
  { id: 1, name: 'Section A'},
  { id: 2, name: 'Section B'},
  { id: 3, name: 'Section C'},
  { id: 4, name: 'Section D'},
];

// Sample teachers data
const SAMPLE_TEACHERS: TeacherItem[] = [
  { id: 1, name: 'Dominique Enriquez'},
  { id: 2, name: 'Maria Santos'},
  { id: 3, name: 'Juan Dela Cruz'},
];

const SAMPLE_CLASSES: ClassItem[] = [
  {
    id: 1,
    grade: 'Grade 1',
    section: 'Section A',
    start_year: 2024,
    end_year: 2025,
  },
  {
    id: 2,
    grade: 'Grade 1',
    section: 'Section B',
    start_year: 2024,
    end_year: 2025,
  },
  {
    id: 3,
    grade: 'Grade 2',
    section: 'Section A',
    start_year: 2024,
    end_year: 2025,
  },
];

const SAMPLE_SUBJECTS: SubjectItem[] = [
  {
    id: 1,
    name: 'Filipino',
    grade: 'Grade 1',
    section: 'Section A',
    start_year: 2024,
    end_year: 2025,
  },
  {
    id: 2,
    name: 'English',
    grade: 'Grade 1',
    section: 'Section A',
    start_year: 2024,
    end_year: 2025,
  },
  {
    id: 3,
    name: 'Mathematics',
    grade: 'Grade 1',
    section: 'Section A',
    start_year: 2024,
    end_year: 2025,
  },
  {
    id: 4,
    name: 'Science',
    grade: 'Grade 1',
    section: 'Section A',
    start_year: 2024,
    end_year: 2025,
  },
];

const SAMPLE_STUDENTS: Student[] = [
  {
    id: 1,
    classId: 1,
    name: 'Angela Reyes',
    lrn: '501142400721',
    sex: 'Female',
    schoolYear: '2024 - 2025',
    gradeSection: 'Grade 1 - Section A',
    finalAvgGrade: 90,
    remarks: 'PASSED',
    subjectGrades: [
      {
        subject: 'Filipino',
        q1: 89,
        q2: 91,
        q3: 90,
        q4: 92,
        finalGrade: 91,
        remarks: 'PASSED',
      },
      {
        subject: 'English',
        q1: 88,
        q2: 90,
        q3: 91,
        q4: 90,
        finalGrade: 90,
        remarks: 'PASSED',
      },
      {
        subject: 'Mathematics',
        q1: 90,
        q2: 93,
        q3: 92,
        q4: 94,
        finalGrade: 92,
        remarks: 'PASSED',
      },
      {
        subject: 'Science',
        q1: 87,
        q2: 89,
        q3: 88,
        q4: 90,
        finalGrade: 89,
        remarks: 'PASSED',
      },
      {
        subject: 'Araling Panlipunan',
        q1: 85,
        q2: 88,
        q3: 86,
        q4: 87,
        finalGrade: 87,
        remarks: 'PASSED',
      },
      {
        subject: 'MAPEH',
        q1: 92,
        q2: 93,
        q3: 94,
        q4: 95,
        finalGrade: 94,
        remarks: 'PASSED',
      },
      {
        subject: 'Edukasyon sa Pagpapakatao',
        q1: 88,
        q2: 90,
        q3: 89,
        q4: 91,
        finalGrade: 90,
        remarks: 'PASSED',
      },
      {
        subject: 'Technology and Livelihood Education',
        q1: 86,
        q2: 88,
        q3: 87,
        q4: 89,
        finalGrade: 88,
        remarks: 'PASSED',
      },
    ],
    attendance: {
      months: {
        Jun: { schoolDays: 22, present: 22, absent: 0 },
        Jul: { schoolDays: 0, present: 0, absent: 0 },
        Aug: { schoolDays: 0, present: 0, absent: 0 },
        Sept: { schoolDays: 0, present: 0, absent: 0 },
        Oct: { schoolDays: 0, present: 0, absent: 0 },
        Nov: { schoolDays: 0, present: 0, absent: 0 },
        Dec: { schoolDays: 0, present: 0, absent: 0 },
        Jan: { schoolDays: 0, present: 0, absent: 0 },
        Feb: { schoolDays: 0, present: 0, absent: 0 },
        Mar: { schoolDays: 0, present: 0, absent: 0 },
        Apr: { schoolDays: 0, present: 0, absent: 0 },
      },
    },
  },
  {
    id: 2,
    classId: 1,
    name: 'Angelo Moreno',
    lrn: '501142400731',
    sex: 'Male',
    schoolYear: '2024 - 2025',
    gradeSection: 'Grade 1 - Section A',
    finalAvgGrade: 74,
    remarks: 'FAILED',
    subjectGrades: [
      {
        subject: 'Filipino',
        q1: 75,
        q2: 76,
        q3: 74,
        q4: 73,
        finalGrade: 75,
        remarks: 'PASSED',
      },
      {
        subject: 'English',
        q1: 72,
        q2: 74,
        q3: 73,
        q4: 71,
        finalGrade: 73,
        remarks: 'FAILED',
      },
      {
        subject: 'Mathematics',
        q1: 70,
        q2: 71,
        q3: 72,
        q4: 73,
        finalGrade: 72,
        remarks: 'FAILED',
      },
      {
        subject: 'Science',
        q1: 73,
        q2: 75,
        q3: 74,
        q4: 76,
        finalGrade: 75,
        remarks: 'PASSED',
      },
      {
        subject: 'Araling Panlipunan',
        q1: 74,
        q2: 73,
        q3: 75,
        q4: 74,
        finalGrade: 74,
        remarks: 'FAILED',
      },
      {
        subject: 'MAPEH',
        q1: 76,
        q2: 77,
        q3: 75,
        q4: 78,
        finalGrade: 77,
        remarks: 'PASSED',
      },
      {
        subject: 'Edukasyon sa Pagpapakatao',
        q1: 73,
        q2: 74,
        q3: 72,
        q4: 73,
        finalGrade: 73,
        remarks: 'FAILED',
      },
      {
        subject: 'Technology and Livelihood Education',
        q1: 74,
        q2: 73,
        q3: 75,
        q4: 74,
        finalGrade: 74,
        remarks: 'FAILED',
      },
    ],
    attendance: {
      months: {
        Jun: { schoolDays: 22, present: 20, absent: 2 },
        Jul: { schoolDays: 0, present: 0, absent: 0 },
        Aug: { schoolDays: 0, present: 0, absent: 0 },
        Sept: { schoolDays: 0, present: 0, absent: 0 },
        Oct: { schoolDays: 0, present: 0, absent: 0 },
        Nov: { schoolDays: 0, present: 0, absent: 0 },
        Dec: { schoolDays: 0, present: 0, absent: 0 },
        Jan: { schoolDays: 0, present: 0, absent: 0 },
        Feb: { schoolDays: 0, present: 0, absent: 0 },
        Mar: { schoolDays: 0, present: 0, absent: 0 },
        Apr: { schoolDays: 0, present: 0, absent: 0 },
      },
    },
  },
  {
    id: 3,
    classId: 1,
    name: 'Sophia Dizon',
    lrn: '501142400741',
    sex: 'Female',
    schoolYear: '2024 - 2025',
    gradeSection: 'Grade 1 - Section A',
    finalAvgGrade: 'N/A',
    remarks: 'N/A',
    subjectGrades: [],
    attendance: {
      months: {
        Jun: { schoolDays: 22, present: 0, absent: 22 },
        Jul: { schoolDays: 0, present: 0, absent: 0 },
        Aug: { schoolDays: 0, present: 0, absent: 0 },
        Sept: { schoolDays: 0, present: 0, absent: 0 },
        Oct: { schoolDays: 0, present: 0, absent: 0 },
        Nov: { schoolDays: 0, present: 0, absent: 0 },
        Dec: { schoolDays: 0, present: 0, absent: 0 },
        Jan: { schoolDays: 0, present: 0, absent: 0 },
        Feb: { schoolDays: 0, present: 0, absent: 0 },
        Mar: { schoolDays: 0, present: 0, absent: 0 },
        Apr: { schoolDays: 0, present: 0, absent: 0 },
      },
    },
  },
  {
    id: 4,
    classId: 2,
    name: 'Juan Dela Cruz',
    lrn: '501142400751',
    sex: 'Male',
    schoolYear: '2024 - 2025',
    gradeSection: 'Grade 1 - Section B',
    finalAvgGrade: 85,
    remarks: 'PASSED',
    subjectGrades: [
      {
        subject: 'Filipino',
        q1: 84,
        q2: 85,
        finalGrade: 85,
        remarks: 'PASSED',
      },
      {
        subject: 'English',
        q1: 86,
        q2: 87,
        finalGrade: 87,
        remarks: 'PASSED',
      },
      {
        subject: 'Mathematics',
        q1: 85,
        q2: 84,
        finalGrade: 85,
        remarks: 'PASSED',
      },
      {
        subject: 'Science',
        q1: 83,
        q2: 84,
        finalGrade: 84,
        remarks: 'PASSED',
      },
      {
        subject: 'Araling Panlipunan',
        q1: 85,
        q2: 86,
        finalGrade: 86,
        remarks: 'PASSED',
      },
      {
        subject: 'MAPEH',
        q1: 87,
        q2: 88,
        finalGrade: 88,
        remarks: 'PASSED',
      },
      {
        subject: 'Edukasyon sa Pagpapakatao',
        q1: 84,
        q2: 85,
        finalGrade: 85,
        remarks: 'PASSED',
      },
      {
        subject: 'Technology and Livelihood Education',
        q1: 83,
        q2: 84,
        finalGrade: 84,
        remarks: 'PASSED',
      },
    ],
    attendance: {
      months: {
        Jun: { schoolDays: 22, present: 21, absent: 1 },
        Jul: { schoolDays: 0, present: 0, absent: 0 },
        Aug: { schoolDays: 0, present: 0, absent: 0 },
        Sept: { schoolDays: 0, present: 0, absent: 0 },
        Oct: { schoolDays: 0, present: 0, absent: 0 },
        Nov: { schoolDays: 0, present: 0, absent: 0 },
        Dec: { schoolDays: 0, present: 0, absent: 0 },
        Jan: { schoolDays: 0, present: 0, absent: 0 },
        Feb: { schoolDays: 0, present: 0, absent: 0 },
        Mar: { schoolDays: 0, present: 0, absent: 0 },
        Apr: { schoolDays: 0, present: 0, absent: 0 },
      },
    },
  },
  {
    id: 5,
    classId: 2,
    name: 'Maria Santos',
    lrn: '501142400761',
    sex: 'Female',
    schoolYear: '2024 - 2025',
    gradeSection: 'Grade 1 - Section B',
    finalAvgGrade: 92,
    remarks: 'PASSED',
    subjectGrades: [
      {
        subject: 'Filipino',
        q1: 94,
        q2: 95,
        q3: 93,
        q4: 94,
        finalGrade: 94,
        remarks: 'PASSED',
      },
      {
        subject: 'English',
        q1: 93,
        q2: 94,
        q3: 92,
        q4: 93,
        finalGrade: 93,
        remarks: 'PASSED',
      },
      {
        subject: 'Mathematics',
        q1: 91,
        q2: 92,
        q3: 90,
        q4: 91,
        finalGrade: 91,
        remarks: 'PASSED',
      },
      {
        subject: 'Science',
        q1: 90,
        q2: 91,
        q3: 89,
        q4: 90,
        finalGrade: 90,
        remarks: 'PASSED',
      },
      {
        subject: 'Araling Panlipunan',
        q1: 92,
        q2: 93,
        q3: 91,
        q4: 92,
        finalGrade: 92,
        remarks: 'PASSED',
      },
      {
        subject: 'MAPEH',
        q1: 95,
        q2: 96,
        q3: 94,
        q4: 95,
        finalGrade: 95,
        remarks: 'PASSED',
      },
      {
        subject: 'Edukasyon sa Pagpapakatao',
        q1: 93,
        q2: 94,
        q3: 92,
        q4: 93,
        finalGrade: 93,
        remarks: 'PASSED',
      },
      {
        subject: 'Technology and Livelihood Education',
        q1: 91,
        q2: 92,
        q3: 90,
        q4: 91,
        finalGrade: 91,
        remarks: 'PASSED',
      },
    ],
    attendance: {
      months: {
        Jun: { schoolDays: 22, present: 22, absent: 0 },
        Jul: { schoolDays: 0, present: 0, absent: 0 },
        Aug: { schoolDays: 0, present: 0, absent: 0 },
        Sept: { schoolDays: 0, present: 0, absent: 0 },
        Oct: { schoolDays: 0, present: 0, absent: 0 },
        Nov: { schoolDays: 0, present: 0, absent: 0 },
        Dec: { schoolDays: 0, present: 0, absent: 0 },
        Jan: { schoolDays: 0, present: 0, absent: 0 },
        Feb: { schoolDays: 0, present: 0, absent: 0 },
        Mar: { schoolDays: 0, present: 0, absent: 0 },
        Apr: { schoolDays: 0, present: 0, absent: 0 },
      },
    },
  },
];

export const fetchSections = async (): Promise<SectionItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sections`);
    if (!response.ok) throw new Error('Failed to fetch sections');
    return await response.json();
  } catch (error) {
    console.error('Error fetching sections:', error);
    return SAMPLE_SECTIONS;
  }
};

export const fetchTeachers = async (): Promise<TeacherItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/teachers`);
    if (!response.ok) throw new Error('Failed to fetch teachers');
    return await response.json();
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return SAMPLE_TEACHERS;
  }
};

// Add class to backend
export const addClass = async (classData: {
  grade: string;
  section: string;
  start_year: number;
  end_year: number;
  teacher_id?: number;
}): Promise<ClassItem> => {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    });
    if (!response.ok) throw new Error('Failed to add class');
    return await response.json();
  } catch (error) {
    console.error('Error adding class:', error);
    throw error;
  }
};

// Update class in backend
export const updateClass = async (
  classId: number,
  classData: {
    grade: string;
    section: string;
    start_year: number;
    end_year: number;
    teacher_id?: number;
  }
): Promise<ClassItem> => {
  try {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    });
    if (!response.ok) throw new Error('Failed to update class');
    return await response.json();
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

export const fetchClasses = async (): Promise<ClassItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`);
    if (!response.ok) throw new Error('Failed to fetch classes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching classes:', error);
    return SAMPLE_CLASSES;
  }
};

export const fetchSubjects = async (): Promise<SubjectItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/subjects`);
    if (!response.ok) throw new Error('Failed to fetch subjects');
    return await response.json();
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return SAMPLE_SUBJECTS;
  }
};

export const fetchStudents = async (): Promise<Student[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/students`);
    if (!response.ok) throw new Error('Failed to fetch students');
    return await response.json();
  } catch (error) {
    console.error('Error fetching students:', error);
    return SAMPLE_STUDENTS;
  }
};