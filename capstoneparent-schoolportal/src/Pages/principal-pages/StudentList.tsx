import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft, UserPlus, Download, Loader2 } from 'lucide-react';
import type { Student } from '@/Pages/principal-pages/types';

interface StudentListProps {
  students: Student[];
  isLoadingStudents: boolean;
  onBack: () => void;
  onRemoveStudent: (student: Student) => void;
  onAddStudent: () => void;
  onDownloadTemplate: () => void;
  isDownloadingTemplate?: boolean;
}

export const StudentList = ({
  students,
  isLoadingStudents,
  onBack,
  onRemoveStudent,
  onAddStudent,
  onDownloadTemplate,
  isDownloadingTemplate = false,
}: StudentListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const hasActiveFilters = searchQuery.trim() !== '';

  // Filter students by search
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lrn.includes(searchQuery)
  );

  return (
    <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex flex-col gap-4">
        {/* Back Button & Search */}
        <div className="flex gap-3 items-center flex-wrap">
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
              placeholder="Search LRN or student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300"
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

        <div className="flex gap-3 flex-wrap">
          <Button
            className="bg-(--navbar-bg) text-black hover:bg-yellow-300"
            onClick={onDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {isDownloadingTemplate ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloadingTemplate ? 'Downloading Template...' : 'Download Student List Template'}
          </Button>
          <Button 
            className="bg-(--button-green) hover:bg-green-700 text-white"
            onClick={onAddStudent}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Students
          </Button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg overflow-y-auto border border-gray-200">
        <div className="max-h-[calc(100vh-250px)] overflow-x-auto overflow-y-auto">
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoadingStudents ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-6 py-2 text-left">
                      {student.name}
                    </td>
                    <td className="px-6 py-2 text-center">
                      {student.lrn}
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex justify-center">
                        <button
                          onClick={() => onRemoveStudent(student)}
                          className="p-2 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove Student"
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
                    No students found for this class
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
