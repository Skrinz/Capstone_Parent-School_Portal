import type { ClassItem, SubjectItem, Student } from '@/Pages/teacher-pages/types';

export const filterClasses = (
  classes: ClassItem[],
  gradeLevel: string,
  section: string,
  year: string
): ClassItem[] => {
  return classes.filter((classItem) => {
    const classGrade = classItem.grade || classItem.grade_level?.grade_level || '';
    const classSection = classItem.section_name || classItem.section?.section_name || '';
    
    const matchesGrade = gradeLevel === 'allgrades' || classGrade.includes(gradeLevel);
    const matchesSection = section === 'all' || classSection === section;
    const matchesYear = year === 'all' || `${classItem.syear_start}-${classItem.syear_end}` === year;
    
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
    const matchesSearch = subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeLevel === 'allgrades' || (subject.grade || '').includes(gradeLevel);
    const matchesSection = section === 'all' || subject.section === section;
    const matchesYear = year === 'all' || `${subject.syear_start}-${subject.syear_end}` === year;
    
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
      (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.lrn_number || '').includes(searchQuery);
    const matchesRemarks = remarksFilter === 'all' || student.remarks === remarksFilter;
    
    return matchesSearch && matchesRemarks;
  });
};

export const getStudentCountByClass = (students: Student[]): Record<number, number> => {
  const counts: Record<number, number> = {};
  students.forEach(student => {
    const classId = student.gl_id; // Using gl_id as class grouping for now if no specific clist_id in Student
    counts[classId] = (counts[classId] || 0) + 1;
  });
  return counts;
};

export const getStudentsForClass = (students: Student[], classId: number): Student[] => {
  return students.filter(student => student.gl_id === classId);
};