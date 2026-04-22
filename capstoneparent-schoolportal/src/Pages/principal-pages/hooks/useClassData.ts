import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ClassItem, SubjectItem, Student, SectionItem, TeacherItem, GradeLevelItem } from '@/Pages/principal-pages/types';
import { 
  fetchClasses, 
  fetchSubjects, 
  fetchStudents,
  fetchSections,
  fetchGradeLevels,
  fetchTeachers
} from '@/Pages/principal-pages/services/api';
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
  const [isLoadingGradeLevels, setIsLoadingGradeLevels] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevelItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  // Pagination states
  const [classPagination, setClassPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [studentPagination, setStudentPagination] = useState({ page: 1, limit: 100, total: 0 });
  const [subjectPagination, setSubjectPagination] = useState({ page: 1, limit: 100, total: 0 });

  const loadClasses = useCallback(async (page = 1) => {
    setIsLoadingClasses(true);
    const result = await fetchClasses(page, classPagination.limit);
    setClasses(result.data || []);
    setClassPagination(prev => ({ ...prev, page: result.pagination.page, total: result.pagination.total }));
    setIsLoadingClasses(false);
  }, [classPagination.limit]);

  const loadSubjects = useCallback(async (page = 1) => {
    setIsLoadingSubjects(true);
    const result = await fetchSubjects(page, subjectPagination.limit);
    setSubjects(result.data || []);
    setSubjectPagination(prev => ({ ...prev, page: result.pagination.page, total: result.pagination.total }));
    setIsLoadingSubjects(false);
  }, [subjectPagination.limit]);

  const loadStudents = useCallback(async (page = 1, classId?: number) => {
    setIsLoadingStudents(true);
    const result = await fetchStudents(page, studentPagination.limit, classId);
    setAllStudents(result.data || []);
    setStudentPagination(prev => ({ ...prev, page: result.pagination.page, total: result.pagination.total }));
    setIsLoadingStudents(false);
  }, [studentPagination.limit]);

  const loadSections = useCallback(async () => {
    setIsLoadingSections(true);
    const data = await fetchSections();
    setSections(data || []);
    setIsLoadingSections(false);
  }, []);

  const loadGradeLevels = useCallback(async () => {
    setIsLoadingGradeLevels(true);
    const data = await fetchGradeLevels();
    setGradeLevels(data || []);
    setIsLoadingGradeLevels(false);
  }, []);

  const loadTeachers = useCallback(async () => {
    setIsLoadingTeachers(true);
    const data = await fetchTeachers();
    setTeachers(data || []);
    setIsLoadingTeachers(false);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadClasses();
    loadSubjects();
    loadStudents();
    loadSections();
    loadGradeLevels();
    loadTeachers();
  }, [loadClasses, loadSubjects, loadStudents, loadSections, loadGradeLevels, loadTeachers]);

  // Calculate student counts (defensive check)
  const studentCountByClass = useMemo(
    () => {
      if (!Array.isArray(allStudents)) return {};
      return getStudentCountByClass(allStudents);
    },
    [allStudents]
  );

  // Reload functions
  const reloadClasses = async () => {
    await loadClasses(classPagination.page);
  };

  const reloadSubjects = async () => {
    await loadSubjects(subjectPagination.page);
  };

  const reloadStudents = async () => {
    await loadStudents(studentPagination.page);
  };

  return {
    classes,
    subjects,
    allStudents,
    sections,
    gradeLevels,
    teachers,
    isLoadingClasses,
    isLoadingSubjects,
    isLoadingStudents,
    isLoadingSections,
    isLoadingGradeLevels,
    isLoadingTeachers,
    studentCountByClass,
    classPagination,
    studentPagination,
    subjectPagination,
    filterClasses,
    filterSubjects,
    filterStudents,
    getStudentsForClass,
    loadClasses,
    loadStudents,
    loadSubjects,
    reloadClasses,
    reloadSubjects,
    reloadStudents,
  };
};