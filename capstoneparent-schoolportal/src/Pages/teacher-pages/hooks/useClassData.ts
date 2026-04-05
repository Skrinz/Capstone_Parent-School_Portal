import { useState, useEffect, useMemo } from 'react';
import type { ClassItem, SubjectItem, Student } from '@/Pages/teacher-pages/types';
import type { SectionItem } from '@/Pages/principal-pages/types';
import { fetchClasses, fetchSubjects, fetchStudents } from '@/Pages/teacher-pages/services/api';
import {
  filterClasses,
  filterSubjects,
  filterStudents,
  getStudentCountByClass,
  getStudentsForClass,
} from '@/Pages/teacher-pages/utils/filters';
import {
  fetchSections,
  fetchGradeLevels,
} from '@/Pages/teacher-pages/services/api'

export const useClassData = () => {
  // Loading states
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isLoadingGradeLevels, setIsLoadingGradeLevels] = useState(false);


  // Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [gradeLevels, setGradeLevels] = useState<any[]>([]);
  

  // Load data on mount
  useEffect(() => {
    loadClasses();
    loadSubjects();
    loadStudents();
    loadSections();
    loadGradeLevels();
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

  const loadGradeLevels = async () => {
    setIsLoadingGradeLevels(true);
    const data = await fetchGradeLevels();
    setGradeLevels(data);
    setIsLoadingGradeLevels(false);
  };

  // Calculate student counts
  const studentCountByClass = useMemo(
    () => getStudentCountByClass(allStudents),
    [allStudents]
  );

  return {
    classes,
    subjects,
    sections,
    allStudents,
    gradeLevels,
    isLoadingClasses,
    isLoadingSubjects,
    isLoadingStudents,
    isLoadingSections,
    isLoadingGradeLevels,
    studentCountByClass,
    filterClasses,
    filterSubjects,
    filterStudents,
    getStudentsForClass,
  };
};

