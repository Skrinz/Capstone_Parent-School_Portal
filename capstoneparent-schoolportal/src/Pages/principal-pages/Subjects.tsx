import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, X, ArrowLeft, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClassItem, SubjectItem, TeacherItem } from '@/Pages/principal-pages/types';

interface SubjectsProps {
  selectedClass: ClassItem;
  subjects: SubjectItem[];
  isLoadingSubjects: boolean;
  teachers: TeacherItem[];
  isLoadingTeachers: boolean;
  onBack: () => void;
  onAssignTeacher: (subject: SubjectItem, teacherId: number) => void;
  onRemoveSubject: (subject: SubjectItem) => void;
  onAddSubjects: (subjectNames: string[]) => void;
  onAssignAdviser: (teacherId: number) => void;
}

// Static list of available subjects
const AVAILABLE_SUBJECTS = [
  'Mother Tongue',
  'Filipino',
  'English',
  'Mathematics',
  'Science',
  'Araling Panlipunan (AP)',
  'Good Manners & Right Conduct (GMRC)',
  'Edukasyong Pantahanan at Pangkabuhayan (EPP)',
  'MAPEH',
  'Music',
  'Arts',
  'Physical Education (PE)',
  'Health',
  'Edukasyon sa Pagpapakatao (EsP)',
];

export const Subjects = ({
  selectedClass,
  subjects,
  isLoadingSubjects,
  teachers,
  isLoadingTeachers,
  onBack,
  onAssignTeacher,
  onRemoveSubject,
  onAddSubjects,
  onAssignAdviser,
}: SubjectsProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAssignAdviserModalOpen, setIsAssignAdviserModalOpen] = useState(false);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
  const [selectedSubjectForTeacher, setSelectedSubjectForTeacher] = useState<SubjectItem | null>(null);

  // Add Subject modal state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [currentSubjectSelect, setCurrentSubjectSelect] = useState('');

  // Assign Adviser modal state
  const [adviserSearchQuery, setAdviserSearchQuery] = useState('');
  const [selectedAdviser, setSelectedAdviser] = useState<TeacherItem | null>(null);

  // Assign Teacher modal state
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);

  // Filter subjects by search
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get subjects that are not yet added to this class
  const availableSubjectsToAdd = AVAILABLE_SUBJECTS.filter(
    (subjectName) =>
      !subjects.some((s) => s.name === subjectName) &&
      !selectedSubjects.includes(subjectName)
  );

  // Filter teachers for adviser modal
  const filteredAdviserTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(adviserSearchQuery.toLowerCase())
  );

  // Filter teachers for subject teacher modal
  const filteredSubjectTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())
  );

  // Handle adding a subject to the selection
  const handleAddToSelection = () => {
    if (currentSubjectSelect && !selectedSubjects.includes(currentSubjectSelect)) {
      setSelectedSubjects([...selectedSubjects, currentSubjectSelect]);
      setCurrentSubjectSelect('');
    }
  };

  // Handle removing a subject from selection
  const handleRemoveFromSelection = (subjectName: string) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s !== subjectName));
  };

  // Handle submitting add subjects
  const handleSubmitAddSubjects = () => {
    if (selectedSubjects.length > 0) {
      onAddSubjects(selectedSubjects);
      setSelectedSubjects([]);
      setCurrentSubjectSelect('');
      setIsAddSubjectModalOpen(false);
    }
  };

  // Handle submitting adviser assignment
  const handleSubmitAssignAdviser = () => {
    if (selectedAdviser) {
      onAssignAdviser(selectedAdviser.id);
      setSelectedAdviser(null);
      setAdviserSearchQuery('');
      setIsAssignAdviserModalOpen(false);
    }
  };

  // Handle submitting teacher assignment
  const handleSubmitAssignTeacher = () => {
    if (selectedTeacher && selectedSubjectForTeacher) {
      onAssignTeacher(selectedSubjectForTeacher, selectedTeacher.id);
      setSelectedTeacher(null);
      setTeacherSearchQuery('');
      setSelectedSubjectForTeacher(null);
      setIsAssignTeacherModalOpen(false);
    }
  };

  // Open assign teacher modal
  const handleOpenAssignTeacher = (subject: SubjectItem) => {
    setSelectedSubjectForTeacher(subject);
    setTeacherSearchQuery('');
    setSelectedTeacher(null);
    setIsAssignTeacherModalOpen(true);
  };

  return (
    <>
      <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          {/* First Row: Back Button, Search, Class Adviser */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex gap-3 items-center flex-1 w-full">
              <Button 
                className="bg-(--button-green) hover:bg-green-700 text-white"
                onClick={onBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-300"
                />
              </div>
            </div>

            <div className="px-4 py-2 bg-white border border-gray-300 rounded-md whitespace-nowrap">
              <span className="font-semibold">Assigned Class Adviser: </span>
              <span>{selectedClass.teacher_name || 'Not Assigned'}</span>
            </div>
          </div>

          {/* Second Row: Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button 
              className="bg-(--button-green) hover:bg-green-700 text-white"
              onClick={() => setIsAddSubjectModalOpen(true)}
            >
              <Plus className="h-5 w-5" />
              Add Subject
            </Button>
            <Button 
              className="bg-(--button-green) hover:bg-green-700 text-white"
              onClick={() => setIsAssignAdviserModalOpen(true)}
            >
              <UserPlus className="h-5 w-5" />
              Assign Class Adviser
            </Button>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Subject Name
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Assigned Teacher
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingSubjects ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      Loading subjects...
                    </td>
                  </tr>
                ) : filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-6 py-2 text-left">
                        {subject.name}
                      </td>
                      <td className="px-6 py-2 text-center">
                        {subject.teacher_name || '-'}
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenAssignTeacher(subject)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Assign Teacher"
                          >
                            <UserPlus className="h-5 w-5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => onRemoveSubject(subject)}
                            className="p-2 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove Subject"
                          >
                            <X className="h-5 w-5 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No subjects found for this class
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD SUBJECT MODAL */}
      <Dialog open={isAddSubjectModalOpen} onOpenChange={setIsAddSubjectModalOpen}>
        <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">Add Subject</DialogTitle>
              <button
                onClick={() => {
                  setIsAddSubjectModalOpen(false);
                  setSelectedSubjects([]);
                  setCurrentSubjectSelect('');
                }}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="h-8 w-8 font-bold" strokeWidth={3} />
              </button>
            </div>
            <DialogDescription className="sr-only">
              Add one or more subjects to the selected class.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4">
            {/* Subject Selection */}
            <div className="flex gap-2">
              <Select 
                value={currentSubjectSelect} 
                onValueChange={setCurrentSubjectSelect}
              >
                <SelectTrigger className="flex-1 h-12 bg-white border-gray-300">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className="bg-white font-semibold max-h-[300px]">
                  {availableSubjectsToAdd.length > 0 ? (
                    availableSubjectsToAdd.map((subject) => (
                      <SelectItem key={subject} value={subject} className="hover:underline">
                        {subject}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center text-gray-500 text-sm">
                      All subjects have been added
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddToSelection}
                disabled={!currentSubjectSelect}
                className="h-12 px-6 bg-(--button-green) hover:bg-green-700 text-white disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Selected Subjects Display */}
            {selectedSubjects.length > 0 && (
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                <p className="text-sm font-semibold text-gray-700 mb-2">Selected Subjects:</p>
                <div className="space-y-2">
                  {selectedSubjects.map((subject) => (
                    <div
                      key={subject}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-200"
                    >
                      <span className="text-sm text-gray-900">{subject}</span>
                      <button
                        onClick={() => handleRemoveFromSelection(subject)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Button */}
            <Button
              onClick={handleSubmitAddSubjects}
              disabled={selectedSubjects.length === 0}
              className="w-full h-12 bg-(--button-green) hover:bg-green-700 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add ({selectedSubjects.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ASSIGN CLASS ADVISER MODAL */}
      <Dialog open={isAssignAdviserModalOpen} onOpenChange={setIsAssignAdviserModalOpen}>
        <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">Assign Class Adviser</DialogTitle>
              <button
                onClick={() => {
                  setIsAssignAdviserModalOpen(false);
                  setSelectedAdviser(null);
                  setAdviserSearchQuery('');
                }}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="h-8 w-8 font-bold" strokeWidth={3} />
              </button>
            </div>
            <DialogDescription className="sr-only">
              Search for and assign a class adviser to the selected class.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search teacher name..."
                value={adviserSearchQuery}
                onChange={(e) => {
                  setAdviserSearchQuery(e.target.value);
                  setSelectedAdviser(null);
                }}
                className="pl-10 h-12 bg-white border-2 border-gray-300"
              />
            </div>

            {/* Selected Teacher Display */}
            {selectedAdviser && (
              <div className="bg-white border-2 border-green-500 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Selected Teacher:</p>
                <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
                  <span className="text-gray-900 font-medium">{selectedAdviser.name}</span>
                  <button
                    onClick={() => setSelectedAdviser(null)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Teachers List */}
            {!selectedAdviser && adviserSearchQuery && (
              <div className="bg-white border-2 border-gray-300 rounded-lg max-h-[250px] overflow-y-auto">
                {isLoadingTeachers ? (
                  <div className="p-4 text-center text-gray-500">Loading teachers...</div>
                ) : filteredAdviserTeachers.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredAdviserTeachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        onClick={() => setSelectedAdviser(teacher)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-900">{teacher.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">No teachers found</div>
                )}
              </div>
            )}

            {/* Assign Button */}
            <Button
              onClick={handleSubmitAssignAdviser}
              disabled={!selectedAdviser}
              className="w-full h-12 bg-(--button-green) hover:bg-green-700 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ASSIGN SUBJECT TEACHER MODAL */}
      <Dialog open={isAssignTeacherModalOpen} onOpenChange={setIsAssignTeacherModalOpen}>
        <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Assign Teacher
                {selectedSubjectForTeacher && (
                  <span className="block text-base font-normal text-gray-600 mt-1">
                    for {selectedSubjectForTeacher.name}
                  </span>
                )}
              </DialogTitle>
              <button
                onClick={() => {
                  setIsAssignTeacherModalOpen(false);
                  setSelectedTeacher(null);
                  setTeacherSearchQuery('');
                  setSelectedSubjectForTeacher(null);
                }}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="h-8 w-8 font-bold" strokeWidth={3} />
              </button>
            </div>
            <DialogDescription className="sr-only">
              Search for and assign a teacher to the selected subject.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search teacher name..."
                value={teacherSearchQuery}
                onChange={(e) => {
                  setTeacherSearchQuery(e.target.value);
                  setSelectedTeacher(null);
                }}
                className="pl-10 h-12 bg-white border-2 border-gray-300"
              />
            </div>

            {/* Selected Teacher Display */}
            {selectedTeacher && (
              <div className="bg-white border-2 border-green-500 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Selected Teacher:</p>
                <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-md">
                  <span className="text-gray-900 font-medium">{selectedTeacher.name}</span>
                  <button
                    onClick={() => setSelectedTeacher(null)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Teachers List */}
            {!selectedTeacher && teacherSearchQuery && (
              <div className="bg-white border-2 border-gray-300 rounded-lg max-h-[250px] overflow-y-auto">
                {isLoadingTeachers ? (
                  <div className="p-4 text-center text-gray-500">Loading teachers...</div>
                ) : filteredSubjectTeachers.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredSubjectTeachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        onClick={() => setSelectedTeacher(teacher)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-900">{teacher.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">No teachers found</div>
                )}
              </div>
            )}

            {/* Assign Button */}
            <Button
              onClick={handleSubmitAssignTeacher}
              disabled={!selectedTeacher}
              className="w-full h-12 bg-(--button-green) hover:bg-green-700 text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
