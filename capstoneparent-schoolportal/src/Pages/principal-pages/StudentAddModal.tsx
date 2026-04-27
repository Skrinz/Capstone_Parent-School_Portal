import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Search, Upload, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormInputError } from '@/components/ui/FormInputError';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addStudentToClass, lookupStudents } from '@/Pages/principal-pages/services/api';
import type { ClassItem, Student, StudentAddSummary, StudentLookupResult } from '@/Pages/principal-pages/types';
import { ActionConfirmationModal } from '@/components/general/ActionConfirmationModal';
import { ImportResultModal } from '@/components/general/ImportResultModal';
import { validateFiles } from '@/lib/fileValidation';
import { useApiFeedbackStore } from '@/lib/store/apiFeedbackStore';
import { emptyImportSummary, resolveImportSummary } from '@/lib/importSummary';

interface StudentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: ClassItem | null;
  existingStudents: Student[];
  onStudentsChanged: () => Promise<void>;
  onBatchUpload: (
    classId: number,
    file: File,
  ) => Promise<{ data?: unknown; summary?: Partial<StudentAddSummary> } | void>;
}

const emptySummary: StudentAddSummary = {
  ...emptyImportSummary,
};

export const StudentAddModal = ({
  isOpen,
  onClose,
  selectedClass,
  existingStudents,
  onStudentsChanged,
  onBatchUpload,
}: StudentAddModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, clearFeedback } = useApiFeedbackStore();
  const [activeTab, setActiveTab] = useState('single');
  const [singleQuery, setSingleQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<StudentLookupResult[]>([]);
  const [lookupMessage, setLookupMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedBatchFile, setSelectedBatchFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<StudentAddSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSingleConfirm, setShowSingleConfirm] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  const enrolledStudentIds = useMemo(
    () => new Set(existingStudents.map((student) => student.id)),
    [existingStudents]
  );

  const selectedStudent =
    lookupResults.find((student) => student.id === selectedStudentId) ?? null;

  const resetState = () => {
    setActiveTab('single');
    setSingleQuery('');
    setLookupResults([]);
    setLookupMessage('');
    setSelectedStudentId(null);
    setSelectedBatchFile(null);
    setSummary(null);
    setIsSearching(false);
    setIsSubmitting(false);
    clearFeedback();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBatchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    clearFeedback();

    if (!file) {
      setSelectedBatchFile(null);
      return;
    }

    const validation = validateFiles([file], {
      acceptedTypes: ['.xlsx'],
      label: 'student XLSX',
    });

    if (!validation.valid) {
      setSelectedBatchFile(null);
      showError(validation.error);
      event.target.value = '';
      return;
    }

    setSelectedBatchFile(file);
  };

  const handleLookup = async (queryOverride?: string) => {
    const query = (queryOverride ?? singleQuery).trim();

    if (!query) {
      setLookupResults([]);
      setLookupMessage('Type an LRN number or student name to search the database.');
      setSelectedStudentId(null);
      return [];
    }

    setIsSearching(true);
    setLookupMessage('');

    try {
      const results = await lookupStudents(query);
      setLookupResults(results);
      setSelectedStudentId(null);

      if (results.length === 0) {
        setLookupMessage('No student matched that LRN or name in the database.');
      }

      return results;
    } catch (error) {
      console.error('Failed to search students:', error);
      setLookupResults([]);
      setSelectedStudentId(null);
      setLookupMessage('Failed to search students. Please try again.');
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSingleStudent = () => {
    if (!selectedClass || !selectedStudent) return;
    setShowSingleConfirm(true);
  };

  const handleAddSingleStudentConfirm = async () => {
    setShowSingleConfirm(false);
    if (!selectedClass || !selectedStudent) return;

    if (enrolledStudentIds.has(selectedStudent.id)) {
      setSummary({
        ...emptySummary,
        unchanged: 1,
        totalProcessed: 1,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addStudentToClass(selectedClass.id, { student_id: selectedStudent.id });
      await onStudentsChanged();
      setSummary({
        ...emptySummary,
        added: 1,
        totalProcessed: 1,
      });
    } catch (error) {
      console.error('Failed to add student:', error);
      setSummary({
        ...emptySummary,
        failed: 1,
        totalProcessed: 1,
        failures: [
          {
            input: selectedStudent.name,
            message: error instanceof Error ? error.message : 'Failed to add student',
          },
        ],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchAdd = () => {
    if (!selectedClass) return;
    if (!selectedBatchFile) {
      showError('Please choose an .xlsx file to upload.');
      return;
    }
    setShowBatchConfirm(true);
  };

  const handleBatchAddConfirm = async () => {
    setShowBatchConfirm(false);
    if (!selectedClass || !selectedBatchFile) return;

    setIsSubmitting(true);
    clearFeedback();

    try {
      const response = await onBatchUpload(selectedClass.id, selectedBatchFile);
      await onStudentsChanged();
      setSummary(resolveImportSummary(response));
      setSelectedBatchFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setSummary({
        ...emptySummary,
        failed: 1,
        totalProcessed: 1,
        failures: [
          {
            input: selectedBatchFile.name,
            message: error instanceof Error ? error.message : 'Failed to upload student XLSX.',
          },
        ],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen && !summary} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl border-none bg-[#FFFACD] p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">Add Students</DialogTitle>
            <button
              onClick={handleClose}
              className="text-red-600 transition-colors hover:text-red-700"
              disabled={isSearching || isSubmitting}
            >
              <X className="h-8 w-8 font-bold" strokeWidth={3} />
            </button>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            {selectedClass
              ? `Add learners to ${selectedClass.grade} - ${selectedClass.section}.`
              : 'Add learners to the selected class.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-white">
                <TabsTrigger value="single">One at a Time</TabsTrigger>
                <TabsTrigger value="batch">Batch</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={singleQuery}
                      onChange={(event) => setSingleQuery(event.target.value)}
                      placeholder="Search by 12-digit LRN or full student name"
                      className={`h-12 bg-white pl-10 transition-all ${
                        lookupMessage.includes('Failed') || lookupMessage.includes('No student') 
                          ? 'border-red-500 ring-2 ring-red-500/20' 
                          : ''
                      }`}
                      disabled={isSearching || isSubmitting}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => void handleLookup()}
                    disabled={isSearching || isSubmitting || !singleQuery.trim()}
                    className="h-12 bg-(--button-green) text-white hover:bg-green-700"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {lookupMessage ? (
                  <FormInputError 
                    message={lookupMessage} 
                    className={cn(
                      "rounded-lg border p-4 text-sm bg-white",
                      (lookupMessage.includes('Failed') || lookupMessage.includes('No student'))
                        ? "border-red-200 text-red-600"
                        : "border-gray-300 text-gray-600"
                    )}
                  />
                ) : null}

                {lookupResults.length > 0 && (
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-gray-300 bg-white p-3">
                    {lookupResults.map((student) => {
                      const isSelected = student.id === selectedStudentId;
                      const isAlreadyEnrolled = enrolledStudentIds.has(student.id);

                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">
                                LRN: {student.lrn} • {student.grade}
                              </p>
                              <p className="text-xs text-gray-500">Status: {student.status}</p>
                            </div>
                            {isAlreadyEnrolled && (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                Already in class
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleAddSingleStudent}
                  disabled={isSubmitting}
                  className="h-12 w-full bg-(--button-green) text-lg font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Adding...' : 'Add Student'}
                </Button>
              </TabsContent>

              <TabsContent value="batch" className="space-y-4">
                <p className="text-sm text-gray-700">
                  Upload a student list XLSX file. The file should include a <strong>Grade Level</strong> column using Kindergarten or Grade 1 to Grade 6.
                </p>

                <div className="rounded-md border-2 border-dashed border-black bg-white p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleBatchFileChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 text-black hover:bg-gray-200"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Select XLSX File
                  </Button>
                  <p className="mt-1 text-center text-xs text-gray-400">
                    Accepted: XLSX only · No size limit
                  </p>

                  <div className="mt-3 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                    <FileText className="h-5 w-5 text-(--button-green)" />
                    <span className="text-sm text-gray-700">
                      {selectedBatchFile ? selectedBatchFile.name : 'No file selected'}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleBatchAdd}
                  disabled={isSubmitting}
                  className="h-12 w-full bg-(--button-green) text-lg font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Uploading...' : 'Upload XLSX'}
                </Button>
              </TabsContent>
          </Tabs>
        </div>

        <ActionConfirmationModal
          isOpen={showSingleConfirm}
          onClose={() => setShowSingleConfirm(false)}
          onConfirm={handleAddSingleStudentConfirm}
          title="Confirm Add Student"
          message={`Are you sure you want to add ${selectedStudent?.name} to this class?`}
          confirmLabel="Add Student"
          isLoading={isSubmitting}
        />

        <ActionConfirmationModal
          isOpen={showBatchConfirm}
          onClose={() => setShowBatchConfirm(false)}
          onConfirm={handleBatchAddConfirm}
          title="Confirm Batch Upload"
          message={`Are you sure you want to upload the students from "${selectedBatchFile?.name}"?`}
          confirmLabel="Upload"
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>

      <ImportResultModal
        isOpen={Boolean(summary)}
        onClose={handleClose}
        summary={summary}
      />
    </>
  );
};
