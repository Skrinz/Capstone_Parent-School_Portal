import type { ClassItem, SubjectItem, Student } from '@/Pages/teacher-pages/types';

export const filterClasses = (
  classes: ClassItem[],
  gradeLevel: string,
  section: string,
  year: string
): ClassItem[] => {
  return classes.filter((classItem) => {
    const matchesGrade = gradeLevel === 'allgrades' || classItem.grade.includes(gradeLevel);
    const matchesSection = section === 'all' || classItem.section.toLowerCase().includes(section);
    const matchesYear = year === 'all' || `${classItem.start_year}-${classItem.end_year}` === year;
    
    return matchesGrade && matchesSection && matchesYear;
  });
};

export const filterSubjects = (
  subjects: SubjectItem[],
  searchQuery: string,
  gradeLevel: string,
  section: string,
  year: string
): SubjectItem[] => {
  return subjects.filter((subject) => {
    const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeLevel === 'allgrades' || subject.grade.includes(gradeLevel);
    const matchesSection = section === 'all' || subject.section.toLowerCase().includes(section);
    const matchesYear = year === 'all' || `${subject.start_year}-${subject.end_year}` === year;
    
    return matchesSearch && matchesGrade && matchesSection && matchesYear;
  });
};

export const filterStudents = (
  students: Student[],
  searchQuery: string,
  remarksFilter: string
): Student[] => {
  return students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lrn.includes(searchQuery);
    const matchesRemarks = remarksFilter === 'all' || student.remarks === remarksFilter;
    
    return matchesSearch && matchesRemarks;
  });
};

export const getStudentCountByClass = (students: Student[]): Record<number, number> => {
  const counts: Record<number, number> = {};
  students.forEach(student => {
    counts[student.classId] = (counts[student.classId] || 0) + 1;
  });
  return counts;
};

export const getStudentsForClass = (students: Student[], classId: number): Student[] => {
  return students.filter(student => student.classId === classId);
};