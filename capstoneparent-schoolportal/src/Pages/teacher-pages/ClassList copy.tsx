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
import { ArrowLeft, Search, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClassData } from '@/Pages/teacher-pages/hooks/useClassData';
import type { ClassItem, SubjectItem, Student } from '@/Pages/teacher-pages/types';
import { ClassSummary } from "./ClassSummary";
import { StudentGrades } from "./StudentGrades";
import { SubjectSummary } from "./SubjectSummary";

export const ClassList = () => {
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [activeTab, setActiveTab] = useState('class');
  const [studentListTab, setStudentListTab] = useState('students');
  
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

  // Use custom hook for data management
  const {
    classes,
    subjects,
    allStudents,
    isLoadingClasses,
    isLoadingSubjects,
    isLoadingStudents,
    studentCountByClass,
    filterClasses,
    filterSubjects,
    filterStudents,
    getStudentsForClass,
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
    () => selectedClass ? getStudentsForClass(allStudents, selectedClass.id) : [],
    [selectedClass, allStudents]
  );

  // Students for selected subject (filtered by grade/section/year)
  const studentsForSelectedSubject = useMemo(() => {
    if (!selectedSubject) return [];
    
    return allStudents.filter(
      (student) =>
        student.gradeSection === `${selectedSubject.grade} - ${selectedSubject.section}` &&
        student.schoolYear === `${selectedSubject.start_year} - ${selectedSubject.end_year}`
    );
  }, [selectedSubject, allStudents]);

  // Extract subject-specific grades for display
  const subjectStudentGrades = useMemo(() => {
    if (!selectedSubject) return [];

    return studentsForSelectedSubject
      .map((student) => {
        const subjectGrade = student.subjectGrades?.find(
          (sg) => sg.subject === selectedSubject.name
        );

        return {
          id: student.id,
          name: student.name,
          lrn: student.lrn,
          finalAvgGrade: subjectGrade?.finalGrade ?? 'N/A',
          remarks: subjectGrade?.remarks ?? 'N/A',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [studentsForSelectedSubject, selectedSubject]);

  // Filter subject students (reuse same filters)
  const filteredSubjectStudents = useMemo(() => {
    return subjectStudentGrades.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        student.lrn.includes(studentSearchQuery);
      const matchesRemarks = remarksFilter === 'all' || student.remarks === remarksFilter;

      return matchesSearch && matchesRemarks;
    });
  }, [subjectStudentGrades, studentSearchQuery, remarksFilter]);

  const filteredStudents = useMemo(
    () => filterStudents(studentsForSelectedClass, studentSearchQuery, remarksFilter),
    [studentsForSelectedClass, studentSearchQuery, remarksFilter]
  );

  const isDetailView = selectedClass !== null || selectedSubject !== null;

  return (
    // ROOT CONTAINER
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50"> 
      <NavbarTeacher/>

      {/* CONTAINER: */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-5 gap-5">
        
        {/* LEFT PANEL */}
        <div className={`
            bg-(--div-bg) flex flex-col
            w-full md:w-[500px] 
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
                         <SelectItem value="a">Section A</SelectItem>
                         <SelectItem value="b">Section B</SelectItem>
                       </SelectContent>
                     </Select>

                     <Select value={classYear} onValueChange={setClassYear}>
                       <SelectTrigger className="min-w-0 bg-(--navbar-bg) border-none font-semibold">
                         <SelectValue placeholder="Year" />
                       </SelectTrigger>
                       <SelectContent className="bg-(--navbar-bg) border-none font-semibold">
                         <SelectItem value="all">All Years</SelectItem>
                         <SelectItem value="2024-2025">2024 - 2025</SelectItem>
                         <SelectItem value="2023-2024">2023 - 2024</SelectItem>
                       </SelectContent>
                     </Select>

                    <Button
                      className="flex-none bg-(--status-inactive) text-white transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-95"
                      onClick={() => {
                          setClassGradeLevel('allgrades');
                          setClassSection('all');
                          setClassYear('all');
                      }}
                      title="Clear Filters"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Class List */}
                <div className="space-y-2 pb-4">
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
                          setRemarksFilter('all');
                          setStudentSearchQuery('');
                          setSelectedStudent(null);
                        }}
                      >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-base">{classItem.grade} - {classItem.section}</h3>
                              <p className={`text-sm transition-colors ${selectedClass?.id === classItem.id ? 'text-(--tab-subtext)' : 'text-gray-500 group-hover:text-(--tab-subtext)'}`}>
                                {classItem.start_year} - {classItem.end_year}
                              </p>
                            </div>
                            {/* DYNAMIC STUDENT COUNT */}
                            <span className="font-medium">
                              {studentCountByClass[classItem.id] || 0} Students
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
                      <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold">
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
                      <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold">
                        <SelectValue placeholder="Section" />
                      </SelectTrigger>
                      <SelectContent className="bg-(--navbar-bg) border-none font-semibold">
                        <SelectItem value="all">All Sections</SelectItem>
                        <SelectItem value="a">Section A</SelectItem>
                        <SelectItem value="b">Section B</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={subjectYear} onValueChange={setSubjectYear}>
                      <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-(--navbar-bg) border-none font-semibold">
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="2024-2025">2024 - 2025</SelectItem>
                        <SelectItem value="2023-2024">2023 - 2024</SelectItem>
                      </SelectContent>
                    </Select>

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
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pb-4">
                  {isLoadingSubjects ? (
                    <div className="text-center py-8 text-gray-500">Loading subjects...</div>
                  ) : filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subjectItem) => (
                      <Card
                        key={subjectItem.id}
                        className={`group p-4 cursor-pointer transition-colors bg-white border-none hover:bg-(--status-active) hover:text-white ${
                          selectedSubject?.id === subjectItem.id ? 'text-white bg-(--status-active)' : ''
                        }`}
                        onClick={() => {
                          setSelectedSubject(subjectItem);
                          setRemarksFilter('all');
                          setStudentSearchQuery('');
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-base">
                              {subjectItem.name}
                            </h3>
                            <p className={`text-sm transition-colors ${
                              selectedSubject?.id === subjectItem.id 
                                ? 'text-(--tab-subtext)' 
                                : 'text-gray-500 group-hover:text-(--tab-subtext)'
                            }`}>
                              {subjectItem.grade} - {subjectItem.section}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm transition-colors ${
                              selectedSubject?.id === subjectItem.id 
                                ? 'text-(--tab-subtext)' 
                                : 'text-gray-500 group-hover:text-(--tab-subtext)'
                            }`}>
                              {subjectItem.start_year} - {subjectItem.end_year}
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
            bg-(--div-bg) h-full overflow-hidden flex flex-col
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
                  onValueChange={(value) => setStudentListTab(value)}
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
                        
                        <div className="relative flex-1 md:flex-none w-full md:max-w-md min-w-[200px]">
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
                          <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold w-[150px]">
                            <SelectValue placeholder="Remarks" />
                          </SelectTrigger>
                          <SelectContent className="bg-(--navbar-bg) border-none font-semibold w-[150px]">
                            <SelectItem value="all">All Remarks</SelectItem>
                            <SelectItem value="PASSED">Passed</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                            <SelectItem value="N/A">N/A</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          className="flex-none bg-(--status-inactive) text-white transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-95"
                          onClick={() => {
                              setStudentSearchQuery('');
                              setRemarksFilter('all');
                          }}
                          title="Clear Filters"
                        >
                          Clear
                        </Button>
                      </div>

                      <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                        <Button className="bg-(--button-green) hover:bg-green-700 text-white">
                          <Upload className="mr-2 h-4 w-4" />
                          Import Grade Sheet (.xlsx)
                        </Button>
                        <Button className="bg-(--button-green) hover:bg-green-700 text-white">
                          <Download className="mr-2 h-4 w-4" />
                          Export Quarterly Grade Sheet (.xlsx)
                        </Button>
                        <Button className="bg-(--button-green) hover:bg-green-700 text-white">
                          <Download className="mr-2 h-4 w-4" />
                          Download Grade Sheet Template (.xlsx)
                        </Button>
                        <Button className="bg-(--button-green) hover:bg-green-700 text-white">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Class Schedule Picture
                        </Button>
                      </div>

                      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
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
                                    key={student.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelectedStudent(student)}
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
                    <div className="flex gap-3 flex-wrap items-center justify-center md:justify-start">
                      <Button 
                        className="bg-(--button-green) hover:bg-green-700 text-white"
                        onClick={() => {
                          setSelectedSubject(null);
                          setRemarksFilter('all');
                          setStudentSearchQuery('');
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      
                      <div className="relative flex-1 md:flex-none w-full md:max-w-md min-w-[200px]">
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
                        <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold w-[150px]">
                          <SelectValue placeholder="Remarks" />
                        </SelectTrigger>
                        <SelectContent className="bg-(--navbar-bg) border-none font-semibold w-[150px]">
                          <SelectItem value="all">All Remarks</SelectItem>
                          <SelectItem value="PASSED">Passed</SelectItem>
                          <SelectItem value="FAILED">Failed</SelectItem>
                          <SelectItem value="N/A">N/A</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                          className="flex-none bg-(--status-inactive) text-white transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-95"
                          onClick={() => {
                              setStudentSearchQuery('');
                              setRemarksFilter('all');
                          }}
                          title="Clear Filters"
                        >
                          Clear
                        </Button>
                    </div>

                    <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                      <Button className="bg-(--button-green) hover:bg-green-700 text-white">
                        <Upload className="mr-2 h-4 w-4" />
                        Import Grade Sheet (.xlsx)
                      </Button>
                      <Button className="bg-(--button-green) hover:bg-green-700 text-white">
                        <Download className="mr-2 h-4 w-4" />
                        Download Grade Sheet Template (.xlsx)
                      </Button>
                    </div>

                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
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
                                <tr key={student.id} className="hover:bg-gray-50">
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
    </div>
  );
};