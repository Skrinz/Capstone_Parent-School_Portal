import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, PlusCircle, Search, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addStudentToClass, lookupStudents } from '@/Pages/principal-pages/services/api';
import type { ClassItem, Student, StudentAddSummary, StudentLookupResult } from '@/Pages/principal-pages/types';

interface StudentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: ClassItem | null;
  existingStudents: Student[];
  onStudentsChanged: () => Promise<void>;
}

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const parseBatchEntries = (value: string) =>
  value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const findLookupCandidate = (
  rawEntry: string,
  results: StudentLookupResult[]
): StudentLookupResult | null => {
  if (results.length === 0) return null;

  const normalizedEntry = normalizeText(rawEntry);
  const digitsOnly = rawEntry.replace(/\D/g, '');

  if (digitsOnly) {
    const exactLrn = results.find((student) => student.lrn === digitsOnly);
    if (exactLrn) return exactLrn;
  }

  const exactName = results.find(
    (student) => normalizeText(student.name) === normalizedEntry
  );
  if (exactName) return exactName;

  return results.length === 1 ? results[0] : null;
};

const emptySummary: StudentAddSummary = {
  added: 0,
  unchanged: 0,
  failed: 0,
  totalProcessed: 0,
  failures: [],
};

export const StudentAddModal = ({
  isOpen,
  onClose,
  selectedClass,
  existingStudents,
  onStudentsChanged,
}: StudentAddModalProps) => {
  const [activeTab, setActiveTab] = useState('single');
  const [singleQuery, setSingleQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<StudentLookupResult[]>([]);
  const [lookupMessage, setLookupMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [batchInput, setBatchInput] = useState('');
  const [summary, setSummary] = useState<StudentAddSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setBatchInput('');
    setSummary(null);
    setIsSearching(false);
    setIsSubmitting(false);
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

  const handleAddSingleStudent = async () => {
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

  const handleBatchAdd = async () => {
    if (!selectedClass) return;

    const entries = parseBatchEntries(batchInput);
    if (entries.length === 0) {
      setSummary({
        ...emptySummary,
        failed: 1,
        totalProcessed: 1,
        failures: [{ input: 'Batch input', message: 'Please enter at least one LRN or student name.' }],
      });
      return;
    }

    setIsSubmitting(true);

    let added = 0;
    let unchanged = 0;
    let failed = 0;
    const failures: StudentAddSummary['failures'] = [];
    const workingEnrolledIds = new Set(enrolledStudentIds);

    try {
      for (const entry of entries) {
        try {
          const results = await lookupStudents(entry);
          const candidate = findLookupCandidate(entry, results);

          if (!candidate) {
            failed += 1;
            failures.push({
              input: entry,
              message:
                results.length > 1
                  ? 'Multiple students matched. Use a more exact LRN or full name.'
                  : 'Student not found in the database.',
            });
            continue;
          }

          if (workingEnrolledIds.has(candidate.id)) {
            unchanged += 1;
            continue;
          }

          await addStudentToClass(selectedClass.id, { student_id: candidate.id });
          workingEnrolledIds.add(candidate.id);
          added += 1;
        } catch (error) {
          failed += 1;
          failures.push({
            input: entry,
            message: error instanceof Error ? error.message : 'Failed to add student',
          });
        }
      }

      if (added > 0) {
        await onStudentsChanged();
      }

      setSummary({
        added,
        unchanged,
        failed,
        totalProcessed: entries.length,
        failures,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl border-none bg-[#FFFACD] p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {summary ? 'Added Students' : 'Add Students'}
            </DialogTitle>
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
          {summary ? (
            <div className="space-y-6 rounded-b-xl bg-white p-6 text-center">
              <div className="flex items-center justify-center gap-3 text-gray-900">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <span className="text-4xl font-bold">Added Students</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-900">Summary</h3>
                <div className="space-y-2 text-xl text-gray-700">
                  <div className="flex items-center justify-center gap-2">
                    <PlusCircle className="h-6 w-6 text-green-600" />
                    <span>
                      <span className="font-semibold text-green-600">{summary.added}</span> students added
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-6 w-6 text-gray-500" />
                    <span>
                      <span className="font-semibold text-gray-700">{summary.unchanged}</span> records unchanged
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <X className="h-6 w-6 text-red-600" />
                    <span>
                      <span className="font-semibold text-red-600">{summary.failed}</span> records failed
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-2xl font-bold text-gray-900">
                Total processed: {summary.totalProcessed}
              </p>

              {summary.failures.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-4 text-left">
                  <p className="mb-2 font-semibold text-red-700">Failed entries</p>
                  <div className="space-y-2 text-sm text-red-700">
                    {summary.failures.map((failure, index) => (
                      <p key={`${failure.input}-${index}`}>
                        <span className="font-semibold">{failure.input}:</span> {failure.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSummary(null)}
                  className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                >
                  Add More
                </Button>
                <Button
                  type="button"
                  onClick={handleClose}
                  className="bg-(--button-green) text-white hover:bg-green-700"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
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
                      className="h-12 bg-white pl-10"
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
                  <div className="rounded-lg border border-gray-300 bg-white p-4 text-sm text-gray-600">
                    {lookupMessage}
                  </div>
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
                  onClick={() => void handleAddSingleStudent()}
                  disabled={!selectedStudent || isSearching || isSubmitting}
                  className="h-12 w-full bg-(--button-green) text-lg font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Adding...' : 'Add Student'}
                </Button>
              </TabsContent>

              <TabsContent value="batch" className="space-y-4">
                <div className="rounded-lg border border-gray-300 bg-white p-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Enter one LRN or full student name per line
                  </label>
                  <textarea
                    value={batchInput}
                    onChange={(event) => setBatchInput(event.target.value)}
                    placeholder={'123456789012\nJuan Dela Cruz\nMaria Santos'}
                    className="min-h-48 w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
                    disabled={isSubmitting}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Each line is checked against the student database before being added to the class.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => void handleBatchAdd()}
                  disabled={isSubmitting || parseBatchEntries(batchInput).length === 0}
                  className="h-12 w-full bg-(--button-green) text-lg font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Checking and Adding...' : 'Add Students'}
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
