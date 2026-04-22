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
  // isLoadingStudents = full list load on mount
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  // isLoadingSelectedClassStudents = per-class fetch triggered by a card click
  const [isLoadingSelectedClassStudents, setIsLoadingSelectedClassStudents] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isLoadingGradeLevels, setIsLoadingGradeLevels] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

  // Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  // allStudents: full list loaded once on mount — NEVER overwritten by a class-specific fetch.
  // Keeps studentCountByClass stable across all card clicks and tab switches.
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  // selectedClassStudents: students for the currently selected class card only.
  // Safe to overwrite on every class card click.
  const [selectedClassStudents, setSelectedClassStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevelItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  // Pagination states
  const [classPagination, setClassPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [studentPagination, setStudentPagination] = useState({ page: 1, limit: 100, total: 0 });
  const [selectedClassStudentPagination, setSelectedClassStudentPagination] = useState({ page: 1, limit: 100, total: 0 });
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

  // Loads the FULL student list into allStudents. Only called on mount (no classId).
  // Must never be called with a classId — that path is handled by loadClassStudents.
  const loadStudents = useCallback(async (page = 1) => {
    setIsLoadingStudents(true);
    const result = await fetchStudents(page, studentPagination.limit);
    setAllStudents(result.data || []);
    setStudentPagination(prev => ({ ...prev, page: result.pagination.page, total: result.pagination.total }));
    setIsLoadingStudents(false);
  }, [studentPagination.limit]);

  // Loads students for a specific class into selectedClassStudents.
  // Does NOT touch allStudents, so studentCountByClass stays stable.
  const loadClassStudents = useCallback(async (page = 1, classId?: number) => {
    setIsLoadingSelectedClassStudents(true);
    const result = await fetchStudents(page, selectedClassStudentPagination.limit, classId);
    setSelectedClassStudents(result.data || []);
    setSelectedClassStudentPagination(prev => ({ ...prev, page: result.pagination.page, total: result.pagination.total }));
    setIsLoadingSelectedClassStudents(false);
  }, [selectedClassStudentPagination.limit]);

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

  // On mount: loadStudents() fetches the full list with no classId.
  useEffect(() => {
    loadClasses();
    loadSubjects();
    loadStudents();
    loadSections();
    loadGradeLevels();
    loadTeachers();
  }, [loadClasses, loadSubjects, loadStudents, loadSections, loadGradeLevels, loadTeachers]);

  // Stable: derived from allStudents which is never overwritten after mount.
  const studentCountByClass = useMemo(
    () => {
      if (!Array.isArray(allStudents)) return {};
      return getStudentCountByClass(allStudents);
    },
    [allStudents]
  );

  const reloadClasses = async () => {
    await loadClasses(classPagination.page);
  };

  const reloadSubjects = async () => {
    await loadSubjects(subjectPagination.page);
  };

  // Reloads the full student list — use after add/remove to keep counts accurate.
  const reloadStudents = async () => {
    await loadStudents(studentPagination.page);
  };

  // Reloads only the selected class's student list for the right panel.
  const reloadClassStudents = async (classId: number) => {
    await loadClassStudents(selectedClassStudentPagination.page, classId);
  };

  return {
    classes,
    subjects,
    allStudents,
    selectedClassStudents,
    sections,
    gradeLevels,
    teachers,
    isLoadingClasses,
    isLoadingSubjects,
    isLoadingStudents,
    isLoadingSelectedClassStudents,
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
    loadClassStudents,
    loadSubjects,
    reloadClasses,
    reloadSubjects,
    reloadStudents,
    reloadClassStudents,
  };
};