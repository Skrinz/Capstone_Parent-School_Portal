import type { ClassItem, SubjectItem, Student } from '@/Pages/principal-pages/types';

export const filterClasses = (
  classes: ClassItem[],
  gradeLevel: string,
  section: string,
  year: string
): ClassItem[] => {
  return classes.filter((classItem) => {
    const matchesGrade = gradeLevel === 'allgrades' || classItem.grade === gradeLevel;
    const matchesSection = section === 'all' || classItem.section === section;
    const matchesYear = year === 'all' || `${classItem.start_year}-${classItem.end_year}` === year;
    
    return matchesGrade && matchesSection && matchesYear;
  });
};

export const filterSubjects = (
  subjects: SubjectItem[],
  searchQuery: string
): SubjectItem[] => {
  return subjects.filter((subject) => {
    return subject.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
};

export const filterStudents = (
  students: Student[],
  searchQuery: string
): Student[] => {
  return students.filter((student) => {
    return student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           student.lrn.includes(searchQuery);
  });
};

export const getStudentCountByClass = (students: Student[]): Record<number, number> => {
  const counts: Record<number, number> = {};
  students.forEach(student => {
    if (student.classId === null) return;
    counts[student.classId] = (counts[student.classId] || 0) + 1;
  });
  return counts;
};

export const getStudentsForClass = (students: Student[], classId: number): Student[] => {
  return students.filter(student => student.classId === classId);
};
