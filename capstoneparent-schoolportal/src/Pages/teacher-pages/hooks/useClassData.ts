import { useState, useEffect, useRef, useMemo } from 'react';
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
} from '@/Pages/teacher-pages/services/api';

export const useClassData = () => {
  // Loading states
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  // isLoadingStudents = loading the full student list on mount
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  // isLoadingSelectedClassStudents = loading students for a specific class card click
  const [isLoadingSelectedClassStudents, setIsLoadingSelectedClassStudents] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isLoadingGradeLevels, setIsLoadingGradeLevels] = useState(false);

  // Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  // allStudents: the FULL student list — loaded once on mount, never overwritten.
  // Used for: studentCountByClass (class card counts) and studentsForSelectedSubject.
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  // selectedClassStudents: students for the currently selected class card.
  // Overwritten each time a class card is clicked.
  const [selectedClassStudents, setSelectedClassStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [gradeLevels, setGradeLevels] = useState<any[]>([]);

  // Guard: prevent re-fetching subjects on every tab switch
  const hasLoadedSubjects = useRef(false);

  // On mount: load classes, all students (for stable counts), sections, grade levels.
  // Subjects are NOT loaded here — they are loaded lazily when the Subject tab is opened.
  useEffect(() => {
    loadClasses();
    loadAllStudents();
    loadSections();
    loadGradeLevels();
  }, []);

  // Loads the FULL student list. Only called on mount.
  // Must never be called again with a classId — that path is handled by loadClassStudents.
  const loadAllStudents = async () => {
    setIsLoadingStudents(true);
    const data = await fetchStudents();
    setAllStudents(data);
    setIsLoadingStudents(false);
  };

  // Loads students for a specific class and stores them in selectedClassStudents.
  // Does NOT touch allStudents, so studentCountByClass stays stable.
  const loadClassStudents = async (classId: number) => {
    setIsLoadingSelectedClassStudents(true);
    const data = await fetchStudents(classId);
    setSelectedClassStudents(data);
    setIsLoadingSelectedClassStudents(false);
  };

  // Loads subjects lazily — only on the first Subject tab visit.
  const loadSubjectsIfNeeded = async () => {
    if (hasLoadedSubjects.current) return;
    setIsLoadingSubjects(true);
    const data = await fetchSubjects();
    setSubjects(data);
    setIsLoadingSubjects(false);
    hasLoadedSubjects.current = true;
  };

  const loadClasses = async () => {
    setIsLoadingClasses(true);
    const data = await fetchClasses();
    setClasses(data);
    setIsLoadingClasses(false);
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

  // Stable: derived from allStudents which is never overwritten after mount.
  const studentCountByClass = useMemo(
    () => getStudentCountByClass(allStudents),
    [allStudents]
  );

  return {
    classes,
    subjects,
    sections,
    allStudents,
    selectedClassStudents,
    gradeLevels,
    isLoadingClasses,
    isLoadingSubjects,
    isLoadingStudents,
    isLoadingSelectedClassStudents,
    isLoadingSections,
    isLoadingGradeLevels,
    studentCountByClass,
    filterClasses,
    filterSubjects,
    filterStudents,
    getStudentsForClass,
    loadClassStudents,
    loadSubjectsIfNeeded,
  };
};