import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormInputError } from '@/components/ui/FormInputError';
import { Edit, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClassData } from '@/Pages/principal-pages/hooks/useClassData';
import {
  addClass,
  assignClassAdviser,
  assignTeacherToSubject,
  removeStudentFromClass,
  updateClass,
} from '@/Pages/principal-pages/services/api';
import type { ClassItem, SubjectItem, Student } from '@/Pages/principal-pages/types';
import { NavbarPrincipal } from '@/components/principal/NavbarPrincipal';
import { Subjects } from '@/Pages/principal-pages/Subjects';
import { StudentList } from '@/Pages/principal-pages/StudentList';
import { StudentAddModal } from '@/Pages/principal-pages/StudentAddModal';
import { ActionConfirmationModal } from '@/components/general/ActionConfirmationModal';
import { downloadStudentListTemplate, uploadStudentList } from '@/Pages/principal-pages/services/fileService';
import { useApiFeedbackStore } from '@/lib/store/apiFeedbackStore';

export const ManageClassLists = () => {
  const showError = useApiFeedbackStore((state) => state.showError);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isDownloadingStudentTemplate, setIsDownloadingStudentTemplate] = useState(false);
  
  // Filters
  const [gradeLevel, setGradeLevel] = useState('allgrades');
  const [section, setSection] = useState('all');
  const [year, setYear] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [isRemoveStudentConfirmOpen, setIsRemoveStudentConfirmOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);

  // Form states for Add Class
  const [addFormData, setAddFormData] = useState({
    gradeLevel: '',
    section: '',
    schoolYearStart: '',
    schoolYearEnd: '',
    teacherId: '',
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});

  // Form states for Edit Class
  const [editFormData, setEditFormData] = useState({
    gradeLevel: '',
    section: '',
    schoolYearStart: '',
    schoolYearEnd: '',
    teacherId: '',
  });
  const [addTeacherSearchQuery, setAddTeacherSearchQuery] = useState('');
  const [editTeacherSearchQuery, setEditTeacherSearchQuery] = useState('');

  // Use custom hook for data management
  const {
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
    classPagination,
    loadClasses,
    loadStudents,
    filterClasses,
    reloadClasses,
    reloadSubjects,
  } = useClassData();

  // Apply filters
  const filteredClasses = useMemo(
    () => filterClasses(classes, gradeLevel, section, year),
    [classes, gradeLevel, section, year]
  );
  const hasActiveClassFilters =
    gradeLevel !== 'allgrades' || section !== 'all' || year !== 'all';

  const handleClearClassFilters = () => {
    setGradeLevel('allgrades');
    setSection('all');
    setYear('all');
  };

  const rankedTeachersForEditModal = useMemo(() => {
    const query = editTeacherSearchQuery.trim().toLowerCase();

    if (!query) {
      return teachers.slice(0, 8);
    }

    const queryTokens = query.split(/\s+/).filter(Boolean);

    const scoreTeacher = (teacher: typeof teachers[number]) => {
      const fname = teacher.fname.toLowerCase();
      const lname = teacher.lname.toLowerCase();
      const fullName = `${fname} ${lname}`;

      let score = 0;

      if (fullName === query) score += 1000;
      if (`${lname}, ${fname}` === query) score += 950;
      if (fullName.startsWith(query)) score += 500;
      if (fname.startsWith(query) || lname.startsWith(query)) score += 400;
      if (fullName.includes(query)) score += 250;

      queryTokens.forEach((token) => {
        if (fname === token || lname === token) score += 180;
        else if (fname.startsWith(token) || lname.startsWith(token)) score += 120;
        else if (fname.includes(token) || lname.includes(token)) score += 70;
      });

      return score;
    };

    return teachers
      .map((teacher) => ({ teacher, score: scoreTeacher(teacher) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.teacher.name.localeCompare(b.teacher.name))
      .slice(0, 8)
      .map(({ teacher }) => teacher);
  }, [editTeacherSearchQuery, teachers]);

  const rankedTeachersForAddModal = useMemo(() => {
    const query = addTeacherSearchQuery.trim().toLowerCase();

    if (!query) {
      return teachers.slice(0, 8);
    }

    const queryTokens = query.split(/\s+/).filter(Boolean);

    const scoreTeacher = (teacher: typeof teachers[number]) => {
      const fname = teacher.fname.toLowerCase();
      const lname = teacher.lname.toLowerCase();
      const fullName = `${fname} ${lname}`;

      let score = 0;

      if (fullName === query) score += 1000;
      if (`${lname}, ${fname}` === query) score += 950;
      if (fullName.startsWith(query)) score += 500;
      if (fname.startsWith(query) || lname.startsWith(query)) score += 400;
      if (fullName.includes(query)) score += 250;

      queryTokens.forEach((token) => {
        if (fname === token || lname === token) score += 180;
        else if (fname.startsWith(token) || lname.startsWith(token)) score += 120;
        else if (fname.includes(token) || lname.includes(token)) score += 70;
      });

      return score;
    };

    return teachers
      .map((teacher) => ({ teacher, score: scoreTeacher(teacher) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.teacher.name.localeCompare(b.teacher.name))
      .slice(0, 8)
      .map(({ teacher }) => teacher);
  }, [addTeacherSearchQuery, teachers]);

  const buildTeacherListKey = (teacherId: number, index: number) => `${teacherId}-${index}`;

  // Generate unique school years from existing classes
  const schoolYears = useMemo(() => {
    const yearsSet = new Set<string>();
    classes.forEach(c => {
      yearsSet.add(`${c.start_year}-${c.end_year}`);
    });
    return Array.from(yearsSet).sort().reverse();
  }, [classes]);

  // Get subjects for selected class
  const classSubjects = useMemo(() => {
    if (!selectedClass) return [];
    return subjects.filter(
      (subject) =>
        subject.grade === selectedClass.grade &&
        subject.section === selectedClass.section &&
        subject.start_year === selectedClass.start_year &&
        subject.end_year === selectedClass.end_year
    );
  }, [selectedClass, subjects]);

  // Get students for selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return allStudents.filter((student) => student.classId === selectedClass.id);
  }, [selectedClass, allStudents]);

  // Handle opening Add Class modal
  const handleOpenAddModal = () => {
    setAddFormData({
      gradeLevel: '',
      section: '',
      schoolYearStart: '',
      schoolYearEnd: '',
      teacherId: '',
    });
    setAddFormErrors({});
    setAddTeacherSearchQuery('');
    setIsAddModalOpen(true);
  };

  // Handle opening Edit Class modal
  const handleEditClass = (classItem: ClassItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClass(classItem);
    setEditFormData({
      gradeLevel: classItem.grade,
      section: classItem.section,
      schoolYearStart: classItem.start_year.toString(),
      schoolYearEnd: classItem.end_year.toString(),
      teacherId: classItem.teacher_id?.toString() || '',
    });
    setEditTeacherSearchQuery(classItem.teacher_name || '');
    setIsEditModalOpen(true);
  };

  // Handle Add Class submission
  const handleAddClass = () => {
    const errors: Record<string, string> = {};
    const selectedGradeLevel = gradeLevels.find((item) => item.name === addFormData.gradeLevel);
    const selectedSection = sections.find((item) => item.name === addFormData.section);
    const selectedTeacherId = addFormData.teacherId ? parseInt(addFormData.teacherId, 10) : undefined;

    if (!selectedGradeLevel) errors.gradeLevel = 'Please select a valid grade level.';
    if (!selectedSection) errors.section = 'Please select a valid section.';
    if (!addFormData.schoolYearStart) errors.schoolYearStart = 'Please select the school year start.';
    if (!addFormData.schoolYearEnd) errors.schoolYearEnd = 'Please select the school year end.';
    if (
      addFormData.schoolYearStart &&
      addFormData.schoolYearEnd &&
      parseInt(addFormData.schoolYearEnd, 10) <= parseInt(addFormData.schoolYearStart, 10)
    ) {
      errors.schoolYearEnd = 'School year end must be later than the start year.';
    }
    if (!selectedTeacherId) errors.teacherId = 'Please choose a class adviser.';

    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors);
      return;
    }

    setAddFormErrors({});
    setIsAddConfirmOpen(true);
  };

  const handleAddClassConfirm = async () => {
    setIsAddConfirmOpen(false);
    const selectedGradeLevel = gradeLevels.find((item) => item.name === addFormData.gradeLevel);
    const selectedSection = sections.find((item) => item.name === addFormData.section);
    const selectedTeacherId = addFormData.teacherId ? parseInt(addFormData.teacherId, 10) : undefined;

    setIsSubmitting(true);
    try {
      await addClass({
        gl_id: selectedGradeLevel!.id,
        section_id: selectedSection!.id,
        class_adviser: selectedTeacherId!,
        syear_start: parseInt(addFormData.schoolYearStart, 10),
        syear_end: parseInt(addFormData.schoolYearEnd, 10),
      });
      
      await Promise.all([reloadClasses(), reloadSubjects()]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to add class:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Class submission
  const handleSaveChanges = () => {
    if (!editingClass) return;
    setIsEditConfirmOpen(true);
  };

  const handleEditClassConfirm = async () => {
    setIsEditConfirmOpen(false);
    if (!editingClass) return;

    const selectedGradeLevel = gradeLevels.find((item) => item.name === editFormData.gradeLevel);
    const selectedSection = sections.find((item) => item.name === editFormData.section);
    const selectedTeacherId = editFormData.teacherId ? parseInt(editFormData.teacherId, 10) : undefined;

    setIsSubmitting(true);
    try {
      await updateClass(editingClass.id, {
        gl_id: selectedGradeLevel?.id,
        section_id: selectedSection?.id,
        class_adviser: selectedTeacherId,
        syear_start: parseInt(editFormData.schoolYearStart, 10),
        syear_end: parseInt(editFormData.schoolYearEnd, 10),
      });
      
      await reloadClasses();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update class:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler functions for subjects and students
  const handleAssignTeacher = (subject: SubjectItem, teacherId: number) => {
    handleAssignSubjectTeacher(subject, teacherId);
  };

  const handleRemoveStudent = (student: Student) => {
    if (!selectedClass) return;
    setStudentToRemove(student);
    setIsRemoveStudentConfirmOpen(true);
  };

  const handleRemoveStudentConfirm = async () => {
    setIsRemoveStudentConfirmOpen(false);
    if (!selectedClass || !studentToRemove) return;

    try {
      await removeStudentFromClass(selectedClass.id, studentToRemove.id);
      await Promise.all([
        reloadClasses(),
        loadStudents(1, selectedClass.id),
      ]);
    } catch (error) {
      console.error('Failed to remove student:', error);
    } finally {
      setStudentToRemove(null);
    }
  };

  const handleOpenAddStudentModal = () => {
    setIsAddStudentModalOpen(true);
  };

  // Generate year options (current year - 5 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  const addStartYearNumber = Number.parseInt(addFormData.schoolYearStart, 10);
  const editStartYearNumber = Number.parseInt(editFormData.schoolYearStart, 10);
  const addEndYearOptions = Number.isNaN(addStartYearNumber)
    ? yearOptions
    : yearOptions.filter((year) => year > addStartYearNumber);
  const editEndYearOptions = Number.isNaN(editStartYearNumber)
    ? yearOptions
    : yearOptions.filter((year) => year > editStartYearNumber);
  const selectedEditTeacher = teachers.find(
    (teacher) => teacher.id.toString() === editFormData.teacherId
  );
  const selectedAddTeacher = teachers.find(
    (teacher) => teacher.id.toString() === addFormData.teacherId
  );
  const isDetailView = selectedClass !== null;

  // Dynamically change color of dropdown fields in modals
  const getSelectColor = (value: string) => value ? "text-gray-900" : "border-gray-300 text-gray-500";

  const handleAssignAdviser = async (teacherId: number) => {
    if (!selectedClass) return;
    
    try {
      await assignClassAdviser(selectedClass.id, teacherId);
      await reloadClasses();
    } catch (error) {
      console.error('Failed to assign class adviser:', error);
    }
  };

  const handleAssignSubjectTeacher = async (subject: SubjectItem, teacherId: number) => {
    try {
      await assignTeacherToSubject(subject.id, teacherId);
      await reloadSubjects();
    } catch (error) {
      console.error('Failed to assign teacher:', error);
    }
  };

  const handleStudentsChanged = async () => {
    if (!selectedClass) return;

    await Promise.all([
      reloadClasses(),
      loadStudents(1, selectedClass.id),
    ]);
  };

  const handleDownloadStudentTemplate = async () => {
    setIsDownloadingStudentTemplate(true);
    try {
      await downloadStudentListTemplate();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : 'Failed to download student list template.'
      );
    } finally {
      setIsDownloadingStudentTemplate(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <NavbarPrincipal />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden p-5 gap-5">
        
        {/* LEFT PANEL */}
        <div className={`
          bg-(--div-bg) flex flex-col
          w-full md:w-125 
          h-full rounded-xl border border-gray-200 shadow-sm
          ${isDetailView ? 'hidden md:flex' : 'flex'}
        `}>
          {/* Header with Add Class Button */}
          <div className="p-4 border-b border-gray-200 rounded-t-xl">
            <Button 
              className="w-full md:w-auto bg-(--button-green) hover:bg-green-700 text-white"
              onClick={handleOpenAddModal}
            >
              Add Class
            </Button>
          </div>

          {/* Filters */}
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex gap-2 flex-wrap">
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger className="flex-1 min-w-0 bg-(--navbar-bg) border-none font-semibold">
                    <SelectValue placeholder="Grade Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-(--navbar-bg) border-none font-semibold">
                    <SelectItem value="allgrades">All Grade Levels</SelectItem>
                    <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                    <SelectItem value="Grade 4">Grade 4</SelectItem>
                    <SelectItem value="Grade 5">Grade 5</SelectItem>
                    <SelectItem value="Grade 6">Grade 6</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="flex-1 min-w-0 bg-(--navbar-bg) border-none font-semibold">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent className="bg-(--navbar-bg) border-none font-semibold">
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.name}>
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="flex-1 min-w-0 bg-(--navbar-bg) border-none font-semibold">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-(--navbar-bg) border-none font-semibold">
                    <SelectItem value="all">All Years</SelectItem>
                    {schoolYears.map((yr) => (
                      <SelectItem key={yr} value={yr}>
                        {yr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveClassFilters ? (
                  <Button
                    className="flex-none bg-(--status-inactive) text-white transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-95"
                    onClick={handleClearClassFilters}
                    title="Clear Filters"
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Class List */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto pb-4">
            {isLoadingClasses ? (
              <div className="text-center py-8 text-gray-500">Loading classes...</div>
            ) : filteredClasses.length > 0 ? (
              filteredClasses.map((classItem) => (
                <Card
                  key={classItem.id}
                  className={`group p-4 cursor-pointer transition-colors bg-white border-none hover:bg-(--status-active) hover:text-white ${
                    selectedClass?.id === classItem.id ? 'text-white bg-(--status-active)' : ''
                  }`}
                  onClick={() => {
                    setSelectedClass(classItem);
                    loadStudents(1, classItem.id);
                  }}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">
                        {classItem.grade} - {classItem.section}
                      </h3>
                      <p className={`text-sm transition-colors ${
                        selectedClass?.id === classItem.id 
                          ? 'text-(--tab-subtext)' 
                          : 'text-gray-500 group-hover:text-(--tab-subtext)'
                      }`}>
                        {classItem.start_year} - {classItem.end_year}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-medium whitespace-nowrap">
                        {classItem.student_count || 0} Students
                      </span>
                      
                      <button
                        onClick={(e) => handleEditClass(classItem, e)}
                        className={`p-2 rounded-full transition-colors ${
                          selectedClass?.id === classItem.id
                            ? 'bg-white/20 hover:bg-white/30'
                            : 'bg-gray-100 hover:bg-gray-200 group-hover:bg-white/20 group-hover:hover:bg-white/30'
                        }`}
                        aria-label="Edit class"
                      >
                        <Edit 
                          className={`h-4 w-4 ${
                            selectedClass?.id === classItem.id
                              ? 'text-white'
                              : 'text-gray-600 group-hover:text-white'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No classes found matching your criteria
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {classPagination.total > classPagination.limit && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {classPagination.page} of {Math.ceil(classPagination.total / classPagination.limit)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadClasses(classPagination.page - 1)}
                  disabled={classPagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadClasses(classPagination.page + 1)}
                  disabled={classPagination.page >= Math.ceil(classPagination.total / classPagination.limit)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className={`
          bg-(--div-bg) h-full overflow-hidden flex flex-col
          w-full md:flex-1
          rounded-xl border border-gray-200 shadow-sm
          ${isDetailView ? 'flex' : 'hidden md:flex'}
        `}>
          {selectedClass ? (
            <div className="h-full flex flex-col w-full">
              <Tabs 
                defaultValue="subjects" 
                className="w-full h-full flex flex-col"
              >
                <TabsList className="w-full rounded-none rounded-t-xl bg-white p-0 border-b border-gray-200">
                  <TabsTrigger value="subjects" className="flex-1 rounded-none data-[state=active]:bg-(--div-bg)">
                    Subjects
                  </TabsTrigger>
                  <TabsTrigger value="students" className="flex-1 rounded-none data-[state=active]:bg-(--div-bg)">
                    Student List
                  </TabsTrigger>
                </TabsList>

                {/* SUBJECTS TAB */}
                <TabsContent value="subjects" className="flex-1 mt-0 overflow-hidden">
                  <Subjects
                    selectedClass={selectedClass}
                    subjects={classSubjects}
                    isLoadingSubjects={isLoadingSubjects}
                    teachers={teachers}
                    isLoadingTeachers={isLoadingTeachers}
                    onBack={() => setSelectedClass(null)}
                    onAssignTeacher={handleAssignTeacher}
                    onAssignAdviser={handleAssignAdviser}
                  />
                </TabsContent>

                {/* STUDENT LIST TAB */}
                <TabsContent value="students" className="flex-1 mt-0 overflow-hidden">
                  <StudentList
                    students={classStudents}
                    isLoadingStudents={isLoadingStudents}
                    onBack={() => setSelectedClass(null)}
                    onRemoveStudent={handleRemoveStudent}
                    onAddStudent={handleOpenAddStudentModal}
                    onDownloadTemplate={handleDownloadStudentTemplate}
                    isDownloadingTemplate={isDownloadingStudentTemplate}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg text-center px-4">
                Please select a class from the left panel to view subjects and students
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ADD CLASS MODAL */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) {
            setAddFormErrors({});
          }
        }}
      >
        <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add Class</DialogTitle>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddFormErrors({});
                }}
                className="text-red-600 hover:text-red-700 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-8 w-8 font-bold" strokeWidth={3} />
              </button>
            </div>
            <DialogDescription className="sr-only">
              Create a class by selecting its grade level, section, school year, and class adviser.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4">
            {/* Grade Level */}
            <Select 
              value={addFormData.gradeLevel} 
              onValueChange={(value) => {
                setAddFormData({ ...addFormData, gradeLevel: value });
                setAddFormErrors((current) => ({ ...current, gradeLevel: '' }));
              }}
              disabled={isSubmitting || isLoadingGradeLevels}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${addFormErrors.gradeLevel ? 'border-red-500 focus:ring-red-500/50' : getSelectColor(addFormData.gradeLevel)}`}>
                <SelectValue placeholder={isLoadingGradeLevels ? "Loading grade levels..." : "Grade Level"} />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade.id} value={grade.name} className="hover:underline">
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormInputError message={addFormErrors.gradeLevel} />

            {/* DYNAMIC SECTIONS */}
            <Select 
              value={addFormData.section} 
              onValueChange={(value) => {
                setAddFormData({ ...addFormData, section: value });
                setAddFormErrors((current) => ({ ...current, section: '' }));
              }}
              disabled={isSubmitting || isLoadingSections}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${addFormErrors.section ? 'border-red-500 focus:ring-red-500/50' : getSelectColor(addFormData.section)}`}>
                <SelectValue placeholder={isLoadingSections ? "Loading sections..." : "Section"} />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.name} className="hover:underline">
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormInputError message={addFormErrors.section} />

            {/* School Year Start */}
            <Select 
              value={addFormData.schoolYearStart} 
              onValueChange={(value) => {
                const startYear = parseInt(value);
                setAddFormData({
                  ...addFormData, 
                  schoolYearStart: value,
                  schoolYearEnd: (startYear + 1).toString(),
                });
                setAddFormErrors((current) => ({
                  ...current,
                  schoolYearStart: '',
                  schoolYearEnd: '',
                }));
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${addFormErrors.schoolYearStart ? 'border-red-500 focus:ring-red-500/50' : getSelectColor(addFormData.schoolYearStart)}`}>
                <SelectValue placeholder="School Year Start" />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {yearOptions.map((year) => (
                  <SelectItem className="hover:underline" key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormInputError message={addFormErrors.schoolYearStart} />

            {/* School Year End */}
            <Select 
              value={addFormData.schoolYearEnd} 
              onValueChange={(value) => {
                const selectedEndYear = Number.parseInt(value, 10);
                if (!Number.isNaN(addStartYearNumber) && selectedEndYear <= addStartYearNumber) {
                  return;
                }
                setAddFormData({ ...addFormData, schoolYearEnd: value });
                setAddFormErrors((current) => ({ ...current, schoolYearEnd: '' }));
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${addFormErrors.schoolYearEnd ? 'border-red-500 focus:ring-red-500/50' : getSelectColor(addFormData.schoolYearEnd)}`}>
                <SelectValue placeholder="School Year End" />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {addEndYearOptions.map((year) => (
                  <SelectItem className="hover:underline" key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormInputError message={addFormErrors.schoolYearEnd} />

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={addTeacherSearchQuery}
                  placeholder={isLoadingTeachers ? 'Loading teachers...' : 'Search class adviser by first or last name'}
                  disabled={isSubmitting || isLoadingTeachers}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAddTeacherSearchQuery(value);
                    setAddFormData({ ...addFormData, teacherId: '' });
                    setAddFormErrors((current) => ({ ...current, teacherId: '' }));
                  }}
                  className={`h-12 bg-white pl-10 ${addFormErrors.teacherId ? 'border-red-500 focus-visible:ring-red-500/50' : ''}`}
                />
              </div>

              {selectedAddTeacher ? (
                <div className="rounded-lg border-2 border-green-500 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Selected Teacher:</p>
                  <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2">
                    <span className="font-medium text-gray-900">{selectedAddTeacher.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAddFormData({ ...addFormData, teacherId: '' });
                        setAddTeacherSearchQuery('');
                        setAddFormErrors((current) => ({ ...current, teacherId: '' }));
                      }}
                      className="text-red-600 transition-colors hover:text-red-700"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : addTeacherSearchQuery ? (
                <div className="max-h-62.5 overflow-y-auto rounded-lg border-2 border-gray-300 bg-white">
                  {rankedTeachersForAddModal.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {rankedTeachersForAddModal.map((teacher, index) => (
                        <button
                          key={buildTeacherListKey(teacher.id, index)}
                          type="button"
                          onClick={() => {
                            setAddFormData({ ...addFormData, teacherId: teacher.id.toString() });
                            setAddTeacherSearchQuery(teacher.name);
                            setAddFormErrors((current) => ({ ...current, teacherId: '' }));
                          }}
                          className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
                        >
                          <span className="text-gray-900">{teacher.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No matching teachers found</div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Search and choose the teacher who will be assigned as class adviser.</p>
              )}
              <FormInputError message={addFormErrors.teacherId} />
            </div>

            {/* Add Button */}
            <Button
              onClick={handleAddClass}
              disabled={isSubmitting}
              className="w-full h-12 bg-(--button-green) hover:bg-green-700 text-white text-lg font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT CLASS MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">Edit Class Information</DialogTitle>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditTeacherSearchQuery('');
                }}
                className="text-red-600 hover:text-red-700 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-8 w-8 font-bold" strokeWidth={3} />
              </button>
            </div>
            <DialogDescription className="sr-only">
              Update the class details and assign a class adviser.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4">
            {/* Grade Level */}
            <Select 
              value={editFormData.gradeLevel} 
              onValueChange={(value) => setEditFormData({...editFormData, gradeLevel: value})}
              disabled={isSubmitting || isLoadingGradeLevels}
            >
              <SelectTrigger className="w-full h-12 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade.id} value={grade.name} className="hover:underline">
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* DYNAMIC SECTIONS */}
            <Select 
              value={editFormData.section} 
              onValueChange={(value) => setEditFormData({...editFormData, section: value})}
              disabled={isSubmitting || isLoadingSections}
            >
              <SelectTrigger className="w-full h-12 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.name} className="hover:underline">
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* School Year Start */}
            <Select 
              value={editFormData.schoolYearStart} 
              onValueChange={(value) => {
                const startYear = parseInt(value);
                setEditFormData({
                  ...editFormData, 
                  schoolYearStart: value,
                  schoolYearEnd: (startYear + 1).toString(),
                });
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full h-12 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {yearOptions.map((year) => (
                  <SelectItem className="hover:underline" key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* School Year End */}
            <Select 
              value={editFormData.schoolYearEnd} 
              onValueChange={(value) => {
                const selectedEndYear = Number.parseInt(value, 10);
                if (!Number.isNaN(editStartYearNumber) && selectedEndYear <= editStartYearNumber) {
                  return;
                }
                setEditFormData({ ...editFormData, schoolYearEnd: value });
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full h-12 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {editEndYearOptions.map((year) => (
                  <SelectItem className="hover:underline" key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* DYNAMIC TEACHERS */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={editTeacherSearchQuery}
                  placeholder={isLoadingTeachers ? 'Loading teachers...' : 'Search class adviser by first or last name'}
                  disabled={isSubmitting || isLoadingTeachers}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEditTeacherSearchQuery(value);
                    setEditFormData({ ...editFormData, teacherId: '' });
                  }}
                  className="h-12 bg-white pl-10"
                />
              </div>

              {selectedEditTeacher ? (
                <div className="rounded-lg border-2 border-green-500 bg-white p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Selected Teacher:</p>
                  <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2">
                    <span className="font-medium text-gray-900">{selectedEditTeacher.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditFormData({ ...editFormData, teacherId: '' });
                        setEditTeacherSearchQuery('');
                      }}
                      className="text-red-600 transition-colors hover:text-red-700"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : editTeacherSearchQuery ? (
                <div className="max-h-62.5 overflow-y-auto rounded-lg border-2 border-gray-300 bg-white">
                  {rankedTeachersForEditModal.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {rankedTeachersForEditModal.map((teacher, index) => (
                        <button
                          key={buildTeacherListKey(teacher.id, index)}
                          type="button"
                          onClick={() => {
                            setEditFormData({ ...editFormData, teacherId: teacher.id.toString() });
                            setEditTeacherSearchQuery(teacher.name);
                          }}
                          className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
                        >
                          <span className="text-gray-900">{teacher.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No matching teachers found</div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Search and choose the teacher who will be assigned as class adviser.</p>
              )}
            </div>

            {/* Save Changes Button */}
            <Button
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="w-full h-12 bg-(--button-green) hover:bg-green-700 text-white text-lg font-semibold mt-2 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StudentAddModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        selectedClass={selectedClass}
        existingStudents={classStudents}
        onStudentsChanged={handleStudentsChanged}
        onBatchUpload={uploadStudentList}
      />

      <ActionConfirmationModal
        isOpen={isAddConfirmOpen}
        onClose={() => setIsAddConfirmOpen(false)}
        onConfirm={handleAddClassConfirm}
        title="Confirm Add Class"
        message={`Are you sure you want to add the class ${addFormData.gradeLevel} - ${addFormData.section}?`}
        confirmLabel="Add Class"
        isLoading={isSubmitting}
      />

      <ActionConfirmationModal
        isOpen={isEditConfirmOpen}
        onClose={() => setIsEditConfirmOpen(false)}
        onConfirm={handleEditClassConfirm}
        title="Confirm Save Changes"
        message="Are you sure you want to save the changes to this class?"
        confirmLabel="Save Changes"
        isLoading={isSubmitting}
      />

      <ActionConfirmationModal
        isOpen={isRemoveStudentConfirmOpen}
        onClose={() => setIsRemoveStudentConfirmOpen(false)}
        onConfirm={handleRemoveStudentConfirm}
        title="Confirm Remove Student"
        message={`Are you sure you want to remove ${studentToRemove?.name} from this class?`}
        confirmLabel="Remove Student"
        isLoading={isSubmitting}
      />
    </div>
  );
};
