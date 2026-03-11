import { useState, useEffect, useMemo } from 'react';
import type { ClassItem, SubjectItem, Student } from '@/Pages/teacher-pages/types';
import { 
  fetchClasses, 
  fetchSubjects, 
  fetchStudents
} from '@/Pages/principal-pages/services/api';
import type { SectionItem, TeacherItem } from '@/Pages/principal-pages/types';
import {
  fetchSections,
  fetchTeachers
} from '@/Pages/principal-pages/services/api'
import {
  filterClasses,
  filterSubjects,
  filterStudents,
  getStudentCountByClass,
  getStudentsForClass,
} from '@/Pages/principal-pages/utils/filters';

export const useClassData = () => {
  // Loading states
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  // Load data on mount
  useEffect(() => {
    loadClasses();
    loadSubjects();
    loadStudents();
    loadSections();
    loadTeachers();
  }, []);

  const loadClasses = async () => {
    setIsLoadingClasses(true);
    const data = await fetchClasses();
    setClasses(data);
    setIsLoadingClasses(false);
  };

  const loadSubjects = async () => {
    setIsLoadingSubjects(true);
    const data = await fetchSubjects();
    setSubjects(data);
    setIsLoadingSubjects(false);
  };

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    const data = await fetchStudents();
    setAllStudents(data);
    setIsLoadingStudents(false);
  };

  const loadSections = async () => {
    setIsLoadingSections(true);
    const data = await fetchSections();
    setSections(data);
    setIsLoadingSections(false);
  };

  const loadTeachers = async () => {
    setIsLoadingTeachers(true);
    const data = await fetchTeachers();
    setTeachers(data);
    setIsLoadingTeachers(false);
  };

  // Calculate student counts
  const studentCountByClass = useMemo(
    () => getStudentCountByClass(allStudents),
    [allStudents]
  );

  // Reload function for after adding/editing classes
  const reloadClasses = async () => {
    await loadClasses();
  };

  return {
    classes,
    subjects,
    allStudents,
    sections,
    teachers,
    isLoadingClasses,
    isLoadingSubjects,
    isLoadingStudents,
    isLoadingSections,
    isLoadingTeachers,
    studentCountByClass,
    filterClasses,
    filterSubjects,
    filterStudents,
    getStudentsForClass,
    reloadClasses,
  };
};