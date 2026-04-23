import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, X, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ClassItem, SubjectItem, TeacherItem } from '@/Pages/principal-pages/types';

interface SubjectsProps {
  selectedClass: ClassItem;
  subjects: SubjectItem[];
  isLoadingSubjects: boolean;
  teachers: TeacherItem[];
  isLoadingTeachers: boolean;
  onBack: () => void;
  onAssignTeacher: (subject: SubjectItem, teacherId: number) => void;
  onAssignAdviser: (teacherId: number) => void;
}

export const Subjects = ({
  selectedClass,
  subjects,
  isLoadingSubjects,
  teachers,
  isLoadingTeachers,
  onBack,
  onAssignTeacher,
  onAssignAdviser,
}: SubjectsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const hasActiveFilters = searchQuery.trim() !== '';
  const buildTeacherListKey = (teacherId: number, index: number) => `${teacherId}-${index}`;

  const [isAssignAdviserModalOpen, setIsAssignAdviserModalOpen] = useState(false);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
  const [selectedSubjectForTeacher, setSelectedSubjectForTeacher] = useState<SubjectItem | null>(null);

  const [adviserSearchQuery, setAdviserSearchQuery] = useState('');
  const [selectedAdviser, setSelectedAdviser] = useState<TeacherItem | null>(null);

  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdviserTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(adviserSearchQuery.toLowerCase())
  );

  const filteredSubjectTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())
  );

  const handleSubmitAssignAdviser = () => {
    if (selectedAdviser) {
      onAssignAdviser(selectedAdviser.id);
      setSelectedAdviser(null);
      setAdviserSearchQuery('');
      setIsAssignAdviserModalOpen(false);
    }
  };

  const handleSubmitAssignTeacher = () => {
    if (selectedTeacher && selectedSubjectForTeacher) {
      onAssignTeacher(selectedSubjectForTeacher, selectedTeacher.id);
      setSelectedTeacher(null);
      setTeacherSearchQuery('');
      setSelectedSubjectForTeacher(null);
      setIsAssignTeacherModalOpen(false);
    }
  };

  const handleOpenAssignTeacher = (subject: SubjectItem) => {
    setSelectedSubjectForTeacher(subject);
    setTeacherSearchQuery('');
    setSelectedTeacher(null);
    setIsAssignTeacherModalOpen(true);
  };

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex w-full flex-1 items-center gap-3">
              <Button
                className="bg-(--button-green) text-white hover:bg-green-700"
                onClick={onBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white pl-10 border-gray-300"
                />
              </div>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  className="bg-(--status-inactive) text-white hover:brightness-110"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>

            <div className="whitespace-nowrap rounded-md border border-gray-300 bg-white px-4 py-2">
              <span className="font-semibold">Assigned Class Adviser: </span>
              <span>{selectedClass.teacher_name || 'Not Assigned'}</span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              className="bg-(--button-green) text-white hover:bg-green-700"
              onClick={() => setIsAssignAdviserModalOpen(true)}
            >
              <UserPlus className="h-5 w-5" />
              Assign Class Adviser
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-gray-900">
                    Subject Name
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold uppercase tracking-wider text-gray-900">
                    Assigned Teacher
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold uppercase tracking-wider text-gray-900">
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
                    <tr key={subject.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-2 text-left">{subject.name}</td>
                      <td className="px-6 py-2 text-center">{subject.teacher_name || '-'}</td>
                      <td className="px-6 py-2">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenAssignTeacher(subject)}
                            className="rounded-full p-2 transition-colors hover:bg-gray-100"
                            title="Assign Teacher"
                          >
                            <UserPlus className="h-5 w-5 text-gray-600" />
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="Search teacher name..."
                value={adviserSearchQuery}
                onChange={(e) => {
                  setAdviserSearchQuery(e.target.value);
                  setSelectedAdviser(null);
                }}
                className="h-12 bg-white pl-10 border-2 border-gray-300"
              />
            </div>

            {selectedAdviser && (
              <div className="rounded-lg border-2 border-green-500 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Selected Teacher:</p>
                <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2">
                  <span className="font-medium text-gray-900">{selectedAdviser.name}</span>
                  <button
                    onClick={() => setSelectedAdviser(null)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {!selectedAdviser && adviserSearchQuery && (
              <div className="max-h-[250px] overflow-y-auto rounded-lg border-2 border-gray-300 bg-white">
                {isLoadingTeachers ? (
                  <div className="p-4 text-center text-gray-500">Loading teachers...</div>
                ) : filteredAdviserTeachers.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredAdviserTeachers.map((teacher, index) => (
                      <button
                        key={buildTeacherListKey(teacher.id, index)}
                        onClick={() => setSelectedAdviser(teacher)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
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

            <Button
              onClick={handleSubmitAssignAdviser}
              disabled={!selectedAdviser}
              className="h-12 w-full bg-(--button-green) text-lg font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignTeacherModalOpen} onOpenChange={setIsAssignTeacherModalOpen}>
        <DialogContent className="bg-[#FFFACD] border-none max-w-md p-0 gap-0" showCloseButton={false}>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Assign Teacher
                {selectedSubjectForTeacher && (
                  <span className="mt-1 block text-base font-normal text-gray-600">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="Search teacher name..."
                value={teacherSearchQuery}
                onChange={(e) => {
                  setTeacherSearchQuery(e.target.value);
                  setSelectedTeacher(null);
                }}
                className="h-12 bg-white pl-10 border-2 border-gray-300"
              />
            </div>

            {selectedTeacher && (
              <div className="rounded-lg border-2 border-green-500 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Selected Teacher:</p>
                <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2">
                  <span className="font-medium text-gray-900">{selectedTeacher.name}</span>
                  <button
                    onClick={() => setSelectedTeacher(null)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {!selectedTeacher && teacherSearchQuery && (
              <div className="max-h-[250px] overflow-y-auto rounded-lg border-2 border-gray-300 bg-white">
                {isLoadingTeachers ? (
                  <div className="p-4 text-center text-gray-500">Loading teachers...</div>
                ) : filteredSubjectTeachers.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredSubjectTeachers.map((teacher, index) => (
                      <button
                        key={buildTeacherListKey(teacher.id, index)}
                        onClick={() => setSelectedTeacher(teacher)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50"
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

            <Button
              onClick={handleSubmitAssignTeacher}
              disabled={!selectedTeacher}
              className="h-12 w-full bg-(--button-green) text-lg font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
