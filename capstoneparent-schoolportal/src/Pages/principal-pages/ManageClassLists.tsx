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
import { Edit, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useClassData } from '@/Pages/principal-pages/hooks/useClassData';
import { addClass, updateClass } from '@/Pages/principal-pages/services/api';
import type { ClassItem } from '@/Pages/principal-pages/types';
import { NavbarPrincipal } from '@/components/principal/NavbarPrincipal';

export const ManageClassLists = () => {
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  
  // Filters
  const [gradeLevel, setGradeLevel] = useState('allgrades');
  const [section, setSection] = useState('all');
  const [year, setYear] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Add Class
  const [addFormData, setAddFormData] = useState({
    gradeLevel: '',
    section: '',
    schoolYearStart: '',
    schoolYearEnd: '',
    teacherId: '',
  });

  // Form states for Edit Class
  const [editFormData, setEditFormData] = useState({
    gradeLevel: '',
    section: '',
    schoolYearStart: '',
    schoolYearEnd: '',
    teacherId: '',
  });

  // Use custom hook for data management
  const {
    classes,
    sections,
    teachers,
    isLoadingClasses,
    isLoadingSections,
    isLoadingTeachers,
    studentCountByClass,
    filterClasses,
    reloadClasses,
  } = useClassData();

  // Apply filters
  const filteredClasses = useMemo(
    () => filterClasses(classes, gradeLevel, section, year),
    [classes, gradeLevel, section, year]
  );

  // Generate unique school years from existing classes
  const schoolYears = useMemo(() => {
    const yearsSet = new Set<string>();
    classes.forEach(c => {
      yearsSet.add(`${c.start_year}-${c.end_year}`);
    });
    return Array.from(yearsSet).sort().reverse();
  }, [classes]);

  // Handle opening Add Class modal
  const handleOpenAddModal = () => {
    setAddFormData({
      gradeLevel: '',
      section: '',
      schoolYearStart: '',
      schoolYearEnd: '',
      teacherId: '',
    });
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
    setIsEditModalOpen(true);
  };

  // Handle Add Class submission
  const handleAddClass = async () => {
    setIsSubmitting(true);
    try {
      await addClass({
        grade: addFormData.gradeLevel,
        section: addFormData.section,
        start_year: parseInt(addFormData.schoolYearStart),
        end_year: parseInt(addFormData.schoolYearEnd),
        teacher_id: addFormData.teacherId ? parseInt(addFormData.teacherId) : undefined,
      });
      
      await reloadClasses(); // Reload the class list
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Failed to add class:', error);
      alert('Failed to add class. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Class submission
  const handleSaveChanges = async () => {
    if (!editingClass) return;
    
    setIsSubmitting(true);
    try {
      await updateClass(editingClass.id, {
        grade: editFormData.gradeLevel,
        section: editFormData.section,
        start_year: parseInt(editFormData.schoolYearStart),
        end_year: parseInt(editFormData.schoolYearEnd),
        teacher_id: editFormData.teacherId ? parseInt(editFormData.teacherId) : undefined,
      });
      
      await reloadClasses(); // Reload the class list
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update class:', error);
      alert('Failed to update class. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate year options (current year - 5 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const isDetailView = selectedClass !== null;

  // Dynamically change color of dropdown fields in modals
  const getSelectColor = (value: string) => value ? "text-gray-900" : "border-gray-300 text-gray-500";

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <NavbarPrincipal />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden p-5 gap-5">
        
        {/* LEFT PANEL */}
        <div className={`
          bg-(--div-bg) flex flex-col
          w-full md:w-[500px] 
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

                {/* DYNAMIC SECTIONS */}
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold">
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

                {/* DYNAMIC YEARS */}
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="bg-(--navbar-bg) border-none font-semibold">
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

                <Button
                  className="flex-none bg-(--status-inactive) text-white transition-all duration-200 hover:brightness-110 hover:shadow-md active:scale-95"
                  onClick={() => {
                    setGradeLevel('allgrades');
                    setSection('all');
                    setYear('all');
                  }}
                  title="Clear Filters"
                >
                  Clear
                </Button>
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
                  onClick={() => setSelectedClass(classItem)}
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
                      {/* Student Count */}
                      <span className="font-medium whitespace-nowrap">
                        {studentCountByClass[classItem.id] || 0} Students
                      </span>
                      
                      {/* Edit Button */}
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
        </div>

        {/* RIGHT PANEL */}
        <div className={`
          bg-(--div-bg) h-full overflow-hidden flex flex-col
          w-full md:flex-1
          rounded-xl border border-gray-200 shadow-sm
          ${isDetailView ? 'flex' : 'hidden md:flex'}
        `}>
          {selectedClass ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedClass.grade} - {selectedClass.section}
                </h2>
                <p className="text-gray-600">
                  {selectedClass.start_year} - {selectedClass.end_year}
                </p>
                <p className="text-gray-500">
                  {studentCountByClass[selectedClass.id] || 0} Students enrolled
                </p>
                {selectedClass.teacher_name && (
                  <p className="text-gray-600">
                    Class Adviser: {selectedClass.teacher_name}
                  </p>
                )}
                <div className="pt-4">
                  <p className="text-gray-400">
                    Class details and management options will be displayed here
                  </p>
                </div>
              </div>
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
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add Class</DialogTitle>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-red-600 hover:text-red-700 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-8 w-8 font-bold" strokeWidth={3} />
              </button>
            </div>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4">
            {/* Grade Level */}
            <Select 
              value={addFormData.gradeLevel} 
              onValueChange={(value) => setAddFormData({...addFormData, gradeLevel: value})}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${getSelectColor(addFormData.gradeLevel)}`}>
                <SelectValue placeholder="Grade Level" />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                <SelectItem value="Kindergarten" className="hover:underline">Kindergarten</SelectItem>
                <SelectItem value="Grade 1" className="hover:underline">Grade 1</SelectItem>
                <SelectItem value="Grade 2" className="hover:underline">Grade 2</SelectItem>
                <SelectItem value="Grade 3" className="hover:underline">Grade 3</SelectItem>
                <SelectItem value="Grade 4" className="hover:underline">Grade 4</SelectItem>
                <SelectItem value="Grade 5" className="hover:underline">Grade 5</SelectItem>
                <SelectItem value="Grade 6" className="hover:underline">Grade 6</SelectItem>
              </SelectContent>
            </Select>

            {/* DYNAMIC SECTIONS */}
            <Select 
              value={addFormData.section} 
              onValueChange={(value) => setAddFormData({...addFormData, section: value})}
              disabled={isSubmitting || isLoadingSections}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${getSelectColor(addFormData.section)}`}>
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
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${getSelectColor(addFormData.schoolYearStart)}`}>
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

            {/* School Year End */}
            <Select 
              value={addFormData.schoolYearEnd} 
              onValueChange={(value) => setAddFormData({...addFormData, schoolYearEnd: value})}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${getSelectColor(addFormData.schoolYearEnd)}`}>
                <SelectValue placeholder="School Year End" />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {yearOptions.map((year) => (
                  <SelectItem className="hover:underline" key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* DYNAMIC TEACHERS */}
            <Select 
              value={addFormData.teacherId} 
              onValueChange={(value) => setAddFormData({...addFormData, teacherId: value})}
              disabled={isSubmitting || isLoadingTeachers}
            >
              <SelectTrigger className={`w-full h-12 bg-white ${getSelectColor(addFormData.teacherId)}`}>
                <SelectValue placeholder={isLoadingTeachers ? "Loading teachers..." : "Class Adviser (Optional)"} />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()} className="hover:underline">
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Button */}
            <Button
              onClick={handleAddClass}
              disabled={isSubmitting || !addFormData.gradeLevel || !addFormData.section || !addFormData.schoolYearStart}
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
                onClick={() => setIsEditModalOpen(false)}
                className="text-red-600 hover:text-red-700 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-8 w-8 font-bold" strokeWidth={3} />
              </button>
            </div>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4">
            {/* Grade Level */}
            <Select 
              value={editFormData.gradeLevel} 
              onValueChange={(value) => setEditFormData({...editFormData, gradeLevel: value})}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full h-12 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                <SelectItem value="Kindergarten" className="hover:underline">Kindergarten</SelectItem>
                <SelectItem value="Grade 1" className="hover:underline">Grade 1</SelectItem>
                <SelectItem value="Grade 2" className="hover:underline">Grade 2</SelectItem>
                <SelectItem value="Grade 3" className="hover:underline">Grade 3</SelectItem>
                <SelectItem value="Grade 4" className="hover:underline">Grade 4</SelectItem>
                <SelectItem value="Grade 5" className="hover:underline">Grade 5</SelectItem>
                <SelectItem value="Grade 6" className="hover:underline">Grade 6</SelectItem>
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
              onValueChange={(value) => setEditFormData({...editFormData, schoolYearEnd: value})}
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

            {/* DYNAMIC TEACHERS */}
            <Select 
              value={editFormData.teacherId} 
              onValueChange={(value) => setEditFormData({...editFormData, teacherId: value})}
              disabled={isSubmitting || isLoadingTeachers}
            >
              <SelectTrigger className="w-full h-12 bg-white border-gray-300">
                <SelectValue placeholder="Class Adviser (Optional)" />
              </SelectTrigger>
              <SelectContent className="bg-white font-semibold">
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()} className="hover:underline">
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Save Changes Button */}
            <Button
              onClick={handleSaveChanges}
              disabled={isSubmitting || !editFormData.gradeLevel || !editFormData.section}
              className="w-full h-12 bg-(--button-green) hover:bg-green-700 text-white text-lg font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};