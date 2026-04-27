import { NavbarTeacher } from "@/components/teacher/NavbarTeacher";
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Download, Upload, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportResultModal } from '@/components/general/ImportResultModal';
import { useClassData } from '@/Pages/teacher-pages/hooks/useClassData';
import type { ClassItem, SubjectItem, Student } from '@/Pages/teacher-pages/types';
import { ClassSummary } from "./ClassSummary";
import { StudentGrades } from "./StudentGrades";
import { SubjectSummary } from "./SubjectSummary";
import { FileUploadModal } from './FileUploadModal';
import {
  downloadGradeSheetTemplate,
  downloadSubjectGradeSheetTemplate,
  exportAllQuartersGradeSheet,
  uploadAttendanceSheet,
  uploadGradeSheet,
  uploadClassSchedulePicture,
  uploadSubjectGradeSheet,
} from './services/fileService';
import { fetchStudentById } from './services/api';
import { useApiFeedbackStore } from '@/lib/store/apiFeedbackStore';
import type { ImportSummaryData } from '@/lib/importSummary';
import { resolveImportSummary } from '@/lib/importSummary';

export const ClassList = () => {
  const showError = useApiFeedbackStore((state) => state.showError);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [activeTab, setActiveTab] = useState('class');
  
  // Class filters
  const [classGradeLevel, setClassGradeLevel] = useState('allgrades');
  const [classSection, setClassSection] = useState('all');
  const [classYear, setClassYear] = useState('all');
  
  // Subject filters
  const [subjectGradeLevel, setSubjectGradeLevel] = useState('allgrades');
  const [subjectSection, setSubjectSection] = useState('all');
  const [subjectYear, setSubjectYear] = useState('all');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  // Student filters (reused for both class and subject views)
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [remarksFilter, setRemarksFilter] = useState('all');

  // Student selection
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoadingStudentDetail, setIsLoadingStudentDetail] = useState(false);

  // Modal states for file uploads
  const [isImportGradeSheetModalOpen, setIsImportGradeSheetModalOpen] = useState(false);
  const [isImportAttendanceModalOpen, setIsImportAttendanceModalOpen] = useState(false);
  const [isUploadScheduleModalOpen, setIsUploadScheduleModalOpen] = useState(false);
  const [isImportSubjectGradeSheetModalOpen, setIsImportSubjectGradeSheetModalOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummaryData | null>(null);
  const [isDownloadingClassTemplate, setIsDownloadingClassTemplate] = useState(false);
  const [isDownloadingSubjectTemplate, setIsDownloadingSubjectTemplate] = useState(false);
  const [isExportingClassGrades, setIsExportingClassGrades] = useState(false);

  // Use custom hook for data management
  const {
    classes,
    sections,
    subjects,
    allStudents,
    isLoadingClasses,
    isLoadingSubjects,
    isLoadingStudents,
    filterClasses,
    filterSubjects,
    filterStudents,
    getStudentsForClass,
    loadStudents,
  } = useClassData();

  // Apply filters
  const filteredClasses = useMemo(
    () => filterClasses(classes, classGradeLevel, classSection, classYear),
    [classes, classGradeLevel, classSection, classYear]
  );

  const filteredSubjects = useMemo(
    () => filterSubjects(subjects, subjectSearchQuery, subjectGradeLevel, subjectSection, subjectYear),
    [subjects, subjectSearchQuery, subjectGradeLevel, subjectSection, subjectYear]
  );

  const studentsForSelectedClass = useMemo(
    () => selectedClass ? getStudentsForClass(allStudents, selectedClass.clist_id) : [],
    [selectedClass, allStudents]
  );

  // Generate unique school years from existing classes
  const schoolYears = useMemo(() => {
    const yearsSet = new Set<string>();
    classes.forEach(c => {
      yearsSet.add(`${c.syear_start}-${c.syear_end}`);
    });
    return Array.from(yearsSet).sort().reverse();
  }, [classes]);

  // Students for selected subject (filtered by subject record enrollment)
  const studentsForSelectedSubject = useMemo(() => {
    if (!selectedSubject) return [];

    const subjectClassIds = selectedSubject.classListIds ?? [];

    return allStudents.filter(
      (student) =>
        student.subject_records?.some((sr) => {
          if (sr.srecord_id === selectedSubject.srecord_id) {
            return true;
          }

          const belongsToSelectedClass = sr.subject_record?.class_lists?.some((classList) =>
            subjectClassIds.includes(classList.clist_id)
          );

          return Boolean(
            belongsToSelectedClass &&
            sr.subject_name === selectedSubject.subject_name
          );
        }) ?? false
    );
  }, [selectedSubject, allStudents]);

  // Extract subject-specific grades for display
  const subjectStudentGrades = useMemo(() => {
    if (!selectedSubject) return [];

    return studentsForSelectedSubject
      .map((student) => {
        const subjectGrade = student.subject_records?.find(
          (sg) => sg.srecord_id === selectedSubject.srecord_id
        );

        return {
          id: student.student_id,
          name: student.name,
          lrn: student.lrn_number,
          finalAvgGrade: subjectGrade?.avg_grade ?? 'N/A',
          remarks: subjectGrade?.remarks ?? 'N/A',
        };
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [studentsForSelectedSubject, selectedSubject]);

  // Filter subject students (reuse same filters)
  const filteredSubjectStudents = useMemo(() => {
    return subjectStudentGrades.filter((student) => {
      const matchesSearch =
        (student.name || '').toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        (student.lrn || '').includes(studentSearchQuery);
      const matchesRemarks = remarksFilter === 'all' || student.remarks === remarksFilter;

      return matchesSearch && matchesRemarks;
    });
  }, [subjectStudentGrades, studentSearchQuery, remarksFilter]);

  const filteredStudents = useMemo(
    () => filterStudents(studentsForSelectedClass, studentSearchQuery, remarksFilter),
    [studentsForSelectedClass, studentSearchQuery, remarksFilter]
  );
  const hasActiveClassFilters =
    classGradeLevel !== 'allgrades' || classSection !== 'all' || classYear !== 'all';
  const hasActiveSubjectFilters =
    subjectSearchQuery.trim() !== '' ||
    subjectGradeLevel !== 'allgrades' ||
    subjectSection !== 'all' ||
    subjectYear !== 'all';
  const hasActiveStudentFilters =
    studentSearchQuery.trim() !== '' || remarksFilter !== 'all';

  const isDetailView = selectedClass !== null || selectedSubject !== null;

  // Download handlers
  const handleDownloadTemplate = async () => {
    setIsDownloadingClassTemplate(true);
    try {
      await downloadGradeSheetTemplate();
    } catch (error) {
      showError('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingClassTemplate(false);
    }
  };

  const handleDownloadSubjectTemplate = async () => {
    setIsDownloadingSubjectTemplate(true);
    try {
      await downloadSubjectGradeSheetTemplate();
    } catch (error) {
      showError('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingSubjectTemplate(false);
    }
  };

  const handleExportAllQuartersGrades = async () => {
    if (!selectedClass) return;

    setIsExportingClassGrades(true);
    try {
      await exportAllQuartersGradeSheet(selectedClass.clist_id);
    } catch (error) {
      showError('Failed to export grades. Please try again.');
    } finally {
      setIsExportingClassGrades(false);
    }
  };

  // Upload handlers
  const handleImportGradeSheet = async (file: File) => {
    if (!selectedClass) return;
    
    try {
      const response = await uploadGradeSheet(selectedClass.clist_id, file);
      setImportSummary(resolveImportSummary(response));
      loadStudents(selectedClass.clist_id);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to upload grade sheet');
    }
  };

  const handleUploadSchedulePicture = async (file: File) => {
    if (!selectedClass) return;
    
    try {
      await uploadClassSchedulePicture(selectedClass.clist_id, file);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to upload class schedule');
    }
  };

  const handleImportAttendanceSheet = async (file: File) => {
    const targetClassId = selectedClass?.clist_id ?? selectedSubject?.classListIds?.[0];
    if (!targetClassId) return;

    try {
      const response = await uploadAttendanceSheet(targetClassId, file);
      setImportSummary(resolveImportSummary(response));
      loadStudents(targetClassId);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to upload attendance sheet');
    }
  };

  const handleImportSubjectGradeSheet = async (file: File) => {
    if (!selectedSubject) return;
    
    try {
      const response = await uploadSubjectGradeSheet(selectedSubject.srecord_id, file);
      setImportSummary(resolveImportSummary(response));
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to upload grade sheet');
    }
  };

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoadingStudentDetail(true);

    try {
      const detailedStudent = await fetchStudentById(student.student_id);
      setSelectedStudent({
        ...student,
        ...detailedStudent,
        gradeSection: detailedStudent.gradeSection || student.gradeSection,
        schoolYear: detailedStudent.schoolYear || student.schoolYear,
        finalAvgGrade:
          detailedStudent.finalAvgGrade === 'N/A'
            ? student.finalAvgGrade
            : detailedStudent.finalAvgGrade,
        remarks:
          detailedStudent.remarks === 'N/A'
            ? student.remarks
            : detailedStudent.remarks,
      });
    } catch (error) {
      console.error('Error fetching student details:', error);
      showError('Failed to load student details. Please try again.');
    } finally {
      setIsLoadingStudentDetail(false);
    }
  };

  return (
    // ROOT CONTAINER
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50"> 
      <NavbarTeacher/>

      {/* CONTAINER: */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-5 gap-5">
        
        {/* LEFT PANEL */}
        <div className={`
            bg-(--div-bg) flex flex-col
            w-full md:w-125 
            h-full rounded-xl border border-gray-200 shadow-sm
            ${isDetailView ? 'hidden md:flex' : 'flex'}
        `}>
          <Tabs 
            defaultValue="class" 
            className="w-full h-full flex flex-col"
            onValueChange={(value) => setActiveTab(value)}
          >
             <TabsList className="w-full rounded-none rounded-t-xl bg-white p-0 border-b border-gray-200">
               <TabsTrigger value="class" className="flex-1 rounded-none data-[state=active]:bg-(--div-bg)">
                 Class List
               </TabsTrigger>
               <TabsTrigger value="subject" className="flex-1 rounded-none data-[state=active]:bg-(--div-bg)">
                 Subject List
               </TabsTrigger>
             </TabsList>

             {/* CLASS TAB CONTENT */}
             <TabsContent value="class" className="flex-1 p-4 space-y-4 mt-0 overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex gap-2 w-full min-w-0">
                      <Select value={classGradeLevel} onValueChange={setClassGradeLevel}>
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

                     <Select value={classSection} onValueChange={setClassSection}>
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

                     <Select value={classYear} onValueChange={setClassYear}>
                       <SelectTrigger className="min-w-0 bg-(--navbar-bg) border-none font-semibold">
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
                        onClick={() => {
                            setClassGradeLevel('allgrades');
                            setClassSection('all');
                            setClassYear('all');
                        }}
                        title="Clear Filters"
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Class List */}
                <div className="space-y-2 pb-4">
                  {isLoadingClasses ? (
                    <div className="text-center py-8 text-gray-500">Loading classes...</div>
                  ) : filteredClasses.length > 0 ? (
                    filteredClasses.map((classItem, index) => (
                      <Card
                        key={classItem.clist_id ?? `${classItem.gl_id}-${classItem.section_id}-${classItem.syear_start}-${index}`}
                        className={`group p-4 cursor-pointer transition-colors bg-white border-none hover:bg-(--status-active) hover:text-white ${
                          selectedClass?.clist_id === classItem.clist_id ? 'text-white bg-(--status-active)' : ''
                        }`}
                        onClick={() => {
                          setSelectedClass(classItem);
                          setRemarksFilter('all');
                          setStudentSearchQuery('');
                          setSelectedStudent(null);
                          loadStudents(classItem.clist_id);
                        }}
                      >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-base">{classItem.grade} - {classItem.section_name}</h3>
                              <p className={`text-sm transition-colors ${selectedClass?.clist_id === classItem.clist_id ? 'text-(--tab-subtext)' : 'text-gray-500 group-hover:text-(--tab-subtext)'}`}>
                                {classItem.syear_start} - {classItem.syear_end}
                              </p>
                            </div>
                            {/* DYNAMIC STUDENT COUNT */}
                              <span className="font-medium whitespace-nowrap">
                                {classItem.student_count || 0} Students
                              </span>
                         </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No classes found matching your criteria</div>
                  )}
                </div>
             </TabsContent>

             {/* SUBJECT TAB CONTENT */}
             <TabsContent value="subject" className="flex-1 p-4 space-y-4 mt-0 overflow-y-auto">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search subjects..."
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-gray-300"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={subjectGradeLevel} onValueChange={setSubjectGradeLevel}>
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

                    <Select value={subjectSection} onValueChange={setSubjectSection}>
                      <SelectTrigger className=" flex-1 min-w-0 bg-(--navbar-bg) border-none font-semibold">
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

                    <Select value={subjectYear} onValueChange={setSubjectYear}>
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

                    {hasActiveSubjectFilters ? (
                      <Button
                        className="flex-none bg-(--status-inactive) text-white transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-95"
                        onClick={() => {
                            setSubjectSearchQuery('');
                            setSubjectGradeLevel('allgrades');
                            setSubjectSection('all');
                            setSubjectYear('all');
                        }}
                        title="Clear Filters"
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2 pb-4">
                  {isLoadingSubjects ? (
                    <div className="text-center py-8 text-gray-500">Loading subjects...</div>
                  ) : filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subjectItem, index) => (
                      <Card
                        key={subjectItem.srecord_id ?? `${subjectItem.subject_name}-${subjectItem.syear_start}-${subjectItem.syear_end}-${index}`}
                        className={`group p-4 cursor-pointer transition-colors bg-white border-none hover:bg-(--status-active) hover:text-white ${
                          selectedSubject?.srecord_id === subjectItem.srecord_id ? 'text-white bg-(--status-active)' : ''
                        }`}
                        onClick={() => {
                          setSelectedSubject(subjectItem);
                          setRemarksFilter('all');
                          setStudentSearchQuery('');
                          setSelectedStudent(null);

                          const subjectClassId = subjectItem.classListIds?.[0];
                          loadStudents(subjectClassId);
                        }}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base" title={subjectItem.subject_name}>
                              {subjectItem.subject_name}
                            </h3>
                            <p className={`text-sm transition-colors ${
                              selectedSubject?.srecord_id === subjectItem.srecord_id 
                                ? 'text-(--tab-subtext)' 
                                : 'text-gray-500 group-hover:text-(--tab-subtext)'
                            }`}>
                              {subjectItem.grade} - {subjectItem.section}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 whitespace-nowrap">
                            <p className={`text-sm font-medium transition-colors ${
                              selectedSubject?.srecord_id === subjectItem.srecord_id
                                ? 'text-white'
                                : 'text-gray-700 group-hover:text-white'
                            }`}>
                              {subjectItem.studentCount ?? 0} Students
                            </p>
                            <p className={`text-sm transition-colors ${
                              selectedSubject?.srecord_id === subjectItem.srecord_id 
                                ? 'text-(--tab-subtext)' 
                                : 'text-gray-500 group-hover:text-(--tab-subtext)'
                            }`}>
                              {subjectItem.syear_start} - {subjectItem.syear_end}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No subjects found matching your criteria
                    </div>
                  )}
                </div>
             </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT PANEL */}
        <div className={`
            bg-(--div-bg) h-full overflow-y-auto flex flex-col
            w-full md:flex-1
            rounded-xl border border-gray-200 shadow-sm
            ${isDetailView ? 'flex' : 'hidden md:flex'}
        `}>
          {activeTab === 'class' && (
            selectedClass ? (
              <div className="h-full flex flex-col w-full">
                <Tabs 
                  defaultValue="students" 
                  className="w-full h-full flex flex-col"
                >
                  <TabsList className="w-full rounded-none rounded-t-xl bg-white p-0 border-b border-gray-200">
                    <TabsTrigger value="students" className="flex-1 rounded-none data-[state=active]:bg-(--div-bg)">
                      Student List
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex-1 rounded-none data-[state=active]:bg-(--div-bg)">
                      Class Summary
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="students" className="flex-1 p-4 md:p-6 space-y-4 mt-0 overflow-y-auto">
                    {selectedStudent ? (
                      // Show Student Grades when a student is selected
                      <StudentGrades 
                        student={selectedStudent} 
                        onBack={() => setSelectedStudent(null)} 
                        isLoading={isLoadingStudentDetail}
                      />
                    ) : (
                    <>
                      <div className="flex gap-3 flex-wrap items-center justify-center md:justify-start">
                        <Button 
                          className="bg-(--button-green) hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedClass(null);
                            setRemarksFilter('all');
                            setStudentSearchQuery('');
                            setSelectedStudent(null);
                          }}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        
                        <div className="relative flex-1 md:flex-none w-full md:max-w-md min-w-50">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type="text"
                            placeholder="Search LRN or student name..."
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="pl-10 bg-white border-none"
                          />
                        </div>

                        <Select value={remarksFilter} onValueChange={setRemarksFilter}>
                          <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold w-37.5">
                            <SelectValue placeholder="Remarks" />
                          </SelectTrigger>
                          <SelectContent className="bg-(--navbar-bg) border-none font-semibold w-37.5">
                            <SelectItem value="all">All Remarks</SelectItem>
                            <SelectItem value="PASSED">Passed</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                            <SelectItem value="N/A">N/A</SelectItem>
                          </SelectContent>
                        </Select>

                        {hasActiveStudentFilters ? (
                          <Button
                            className="flex-none bg-(--status-inactive) text-white transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-95"
                            onClick={() => {
                                setStudentSearchQuery('');
                                setRemarksFilter('all');
                            }}
                            title="Clear Filters"
                          >
                            Clear Filters
                          </Button>
                        ) : null}
                      </div>

                      <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                        <Button 
                          className="bg-(--button-green) hover:bg-green-700 text-white"
                          onClick={() => setIsImportGradeSheetModalOpen(true)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Import Grade Sheets (.csv)
                        </Button>
                        <Button
                          className="bg-(--button-green) hover:bg-green-700 text-white"
                          onClick={() => setIsImportAttendanceModalOpen(true)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Import Attendance (.csv)
                        </Button>
                        <Button 
                          className="bg-(--button-green) hover:bg-green-700 text-white"
                          onClick={handleExportAllQuartersGrades}
                          disabled={isExportingClassGrades}
                        >
                          {isExportingClassGrades ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {isExportingClassGrades ? 'Exporting Grade Sheet...' : 'Export Quarterly Grade Sheet (.zip)'}
                        </Button>
                        <Button 
                          className="bg-(--navbar-bg) hover:bg-yellow-300 text-black"
                          onClick={handleDownloadTemplate}
                          disabled={isDownloadingClassTemplate}
                        >
                          {isDownloadingClassTemplate ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {isDownloadingClassTemplate ? 'Downloading Template...' : 'Download Grade Sheet Template (.xlsx)'}
                        </Button>
                        <Button 
                          className="bg-(--button-green) hover:bg-green-700 text-white"
                          onClick={() => setIsUploadScheduleModalOpen(true)}
                        >
                          <Image className="mr-2 h-4 w-4" />
                          Upload Class Schedule Picture
                        </Button>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="max-h-[calc(100vh-250px)] overflow-x-auto overflow-y-auto">
                          <table className="w-full min-w-150">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                                  Student Name
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                                  LRN
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                                  Final Avg Grade
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                                  Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {isLoadingStudents ? (
                                <tr>
                                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    Loading students...
                                  </td>
                                </tr>
                              ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                  <tr 
                                    key={student.student_id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleSelectStudent(student)}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-900">
                                      {student.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                      {student.lrn_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                      {student.finalAvgGrade}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                      <span className={`font-semibold ${
                                        student.remarks === 'PASSED' 
                                          ? 'text-(--button-green)' 
                                          : student.remarks === 'FAILED' 
                                          ? 'text-(--status-denied)' 
                                          : 'text-gray-500'
                                      }`}>
                                        {student.remarks}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No students found for this class
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                  </TabsContent>

                  <TabsContent value="summary" className="flex-1 overflow-y-auto">
                    <ClassSummary students={studentsForSelectedClass} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-lg text-center px-4">
                  Please select a class from the left panel to view students
                </p>
              </div>
            )
          )}

          {/* SUBJECT TAB - WITH TABS */}
          {activeTab === 'subject' && (
            selectedSubject ? (
              <div className="h-full flex flex-col w-full">
                <Tabs 
                  defaultValue="students" 
                  className="w-full h-full flex flex-col"
                >
                  <TabsList className="w-full rounded-none rounded-t-xl bg-white p-0 border-b border-gray-200">
                    <TabsTrigger value="students" className="flex-1 rounded-none data-[state=active]:bg-(--div-bg)">
                      Student List
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex-1 rounded-none data-[state=active]:bg-(--div-bg)">
                      Subject Summary
                    </TabsTrigger>
                  </TabsList>

                  {/* Student List Tab */}
                  <TabsContent value="students" className="flex-1 p-4 md:p-6 space-y-4 mt-0 overflow-y-auto">
                    {selectedStudent ? (
                      <StudentGrades
                        student={selectedStudent}
                        onBack={() => setSelectedStudent(null)}
                        subjectFilter={{
                          srecord_id: selectedSubject.srecord_id,
                          subject_name: selectedSubject.subject_name,
                        }}
                        isLoading={isLoadingStudentDetail}
                      />
                    ) : (
                    <>
                    <div className="flex gap-3 flex-wrap items-center justify-center md:justify-start">
                      <Button 
                        className="bg-(--button-green) hover:bg-green-700 text-white"
                        onClick={() => {
                          setSelectedSubject(null);
                          setRemarksFilter('all');
                          setStudentSearchQuery('');
                          setSelectedStudent(null);
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      
                      <div className="relative flex-1 md:flex-none w-full md:max-w-md min-w-50">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search LRN or student name..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="pl-10 bg-white border-none"
                        />
                      </div>

                      <Select value={remarksFilter} onValueChange={setRemarksFilter}>
                        <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold w-37.5">
                          <SelectValue placeholder="Remarks" />
                        </SelectTrigger>
                        <SelectContent className="bg-(--navbar-bg) border-none font-semibold w-37.5">
                          <SelectItem value="all">All Remarks</SelectItem>
                          <SelectItem value="PASSED">Passed</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="N/A">N/A</SelectItem>
                        </SelectContent>
                      </Select>

                      {hasActiveStudentFilters ? (
                        <Button
                            className="flex-none bg-(--status-inactive) text-white transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-95"
                            onClick={() => {
                                setStudentSearchQuery('');
                                setRemarksFilter('all');
                            }}
                            title="Clear Filters"
                          >
                            Clear Filters
                          </Button>
                      ) : null}
                    </div>

                    <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                      <Button 
                        className="bg-(--button-green) hover:bg-green-700 text-white"
                        onClick={() => setIsImportSubjectGradeSheetModalOpen(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Grade Sheet (.csv)
                      </Button>
                      <Button
                        className="bg-(--button-green) hover:bg-green-700 text-white"
                        onClick={() => setIsImportAttendanceModalOpen(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Attendance (.csv)
                      </Button>
                      <Button 
                        className="bg-(--navbar-bg) hover:bg-yellow-300 text-black"
                        onClick={handleDownloadSubjectTemplate}
                        disabled={isDownloadingSubjectTemplate}
                      >
                        {isDownloadingSubjectTemplate ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {isDownloadingSubjectTemplate ? 'Downloading Template...' : 'Download Grade Sheet Template (.csv)'}
                      </Button>
                    </div>

                    <div className="bg-white rounded-lg overflow-y-auto border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-150">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Student Name
                              </th>
                              <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                                LRN
                              </th>
                              <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Final Avg Grade
                              </th>
                              <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Remarks
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {isLoadingStudents ? (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                  Loading students...
                                </td>
                              </tr>
                            ) : filteredSubjectStudents.length > 0 ? (
                              filteredSubjectStudents.map((student) => (
                                <tr
                                  key={student.id}
                                  className="hover:bg-gray-50 cursor-pointer"
                                  onClick={() => {
                                    const matchingStudent = studentsForSelectedSubject.find(
                                      (subjectStudent) => subjectStudent.student_id === student.id
                                    );

                                    if (matchingStudent) {
                                      handleSelectStudent(matchingStudent);
                                    }
                                  }}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-900">
                                    {student.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                    {student.lrn}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                    {student.finalAvgGrade}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <span className={`font-semibold ${
                                      student.remarks === 'PASSED' 
                                        ? 'text-(--button-green)' 
                                        : student.remarks === 'FAILED' 
                                        ? 'text-(--status-denied)' 
                                        : 'text-gray-500'
                                    }`}>
                                      {student.remarks}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                  No students found for this subject
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    </>
                    )}
                  </TabsContent>

                  {/* Subject Summary Tab */}
                  <TabsContent value="summary" className="flex-1 overflow-y-auto">
                    <SubjectSummary 
                      subject={selectedSubject} 
                      students={studentsForSelectedSubject} 
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-lg text-center px-4">
                  Please select a subject to view details
                </p>
              </div>
            )
          )}
        </div>
      </div>
      {/* File Upload Modals */}
      {/* Class Grades */}
      <FileUploadModal
        isOpen={isImportGradeSheetModalOpen}
        onClose={() => setIsImportGradeSheetModalOpen(false)}
        onUpload={handleImportGradeSheet}
        title="Import Grade Sheets"
        acceptedFileTypes={['.csv']}
        maxSizeMB={5}
      />

      <FileUploadModal
        isOpen={isImportAttendanceModalOpen}
        onClose={() => setIsImportAttendanceModalOpen(false)}
        onUpload={handleImportAttendanceSheet}
        title="Import Attendance Sheet"
        acceptedFileTypes={['.csv']}
        maxSizeMB={5}
      />

      <FileUploadModal 
        isOpen={isUploadScheduleModalOpen}
        onClose={() => setIsUploadScheduleModalOpen(false)}
        onUpload={handleUploadSchedulePicture}
        title="Upload Class Schedule"
        maxSizeMB={15}
        acceptedFileTypes={['.png', '.jpg', '.jpeg', '.webp']}
      />

      <FileUploadModal
        isOpen={isImportSubjectGradeSheetModalOpen}
        onClose={() => setIsImportSubjectGradeSheetModalOpen(false)}
        onUpload={handleImportSubjectGradeSheet}
        title="Import Subject Grade Sheet"
        acceptedFileTypes={['.csv']}
        maxSizeMB={5}
      />

      <ImportResultModal
        isOpen={Boolean(importSummary)}
        onClose={() => setImportSummary(null)}
        summary={importSummary}
      />
    </div>
  );
};
