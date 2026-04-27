import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import type { StudentGradesProps } from '@/Pages/teacher-pages/types';
import { exportStudentQuarterlyGrades } from './services/fileService';

type StudentGradesComponentProps = StudentGradesProps & {
  isLoading?: boolean;
};

export const StudentGrades = ({
  student,
  onBack,
  subjectFilter,
  isLoading = false,
}: StudentGradesComponentProps) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportStudentGrades = async () => {
    const fallbackName = `${student.lname}_${student.fname}_${student.lrn_number}_ReportCard.pdf`
      .replace(/\s+/g, '_');

    setIsExportingPdf(true);
    try {
      await exportStudentQuarterlyGrades(student.student_id, fallbackName);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getNumericGrade = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const subjectRows = useMemo(() => {
    return [...(student.subject_records ?? [])]
      .filter((record) => {
        if (!subjectFilter) {
          return true;
        }

        return (
          record.srecord_id === subjectFilter.srecord_id ||
          record.subject_name === subjectFilter.subject_name
        );
      })
      .filter((record) => record.subject_name)
      .sort((a, b) => (a.subject_name || '').localeCompare(b.subject_name || ''));
  }, [student.subject_records, subjectFilter]);

  // Calculate attendance totals
  const months = ['Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  
  const attendanceMap = useMemo(() => {
    const map: Record<string, { school_days: number; days_present: number; days_absent: number }> = {};
    months.forEach(m => {
       const record = student.attendance_records?.find(r => r.month === m);
       map[m] = {
         school_days: record?.school_days || 0,
         days_present: record?.days_present || 0,
         days_absent: record?.days_absent || 0,
       };
    });
    return map;
  }, [student.attendance_records, months]);

  const totalSchoolDays = useMemo(() => 
    Object.values(attendanceMap).reduce((sum, record) => sum + record.school_days, 0)
  , [attendanceMap]);

  const totalPresent = useMemo(() => 
    Object.values(attendanceMap).reduce((sum, record) => sum + record.days_present, 0)
  , [attendanceMap]);

  const totalAbsent = useMemo(() => 
    Object.values(attendanceMap).reduce((sum, record) => sum + record.days_absent, 0)
  , [attendanceMap]);

  const generalAverage = useMemo(() => {
    const numericAverages = subjectRows
      .map((subject) => getNumericGrade(subject.avg_grade))
      .filter((grade): grade is number => grade !== null);

    if (numericAverages.length === 0) return 'N/A';

    const numericStudentAverage = getNumericGrade(student.finalAvgGrade);
    if (numericStudentAverage !== null) {
      return numericStudentAverage;
    }

    return Math.round((numericAverages.reduce((sum, grade) => sum + grade, 0) / numericAverages.length) * 100) / 100;
  }, [student.finalAvgGrade, subjectRows]);

  const generalRemarks = useMemo(() => {
    const numericAverages = subjectRows
      .map((subject) => getNumericGrade(subject.avg_grade))
      .filter((grade): grade is number => grade !== null);

    if (numericAverages.length === 0) return 'N/A';

    if (student.remarks && student.remarks !== 'N/A') {
      return student.remarks;
    }

    return numericAverages.every((grade) => grade >= 75) ? 'PASSED' : 'FAILED';
  }, [student.remarks, subjectRows]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200 bg-transparent">
        <div className="flex items-center gap-4">
          <Button 
            onClick={onBack}
            className="bg-(--button-green) hover:bg-green-700 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {!subjectFilter ? (
            <Button
              className="bg-(--button-green) hover:bg-green-700 text-white"
              onClick={handleExportStudentGrades}
              disabled={isLoading || isExportingPdf}
            >
              {isExportingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExportingPdf ? 'Exporting PDF...' : 'Export Quarterly Grades (.pdf)'}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="animate-pulse mb-2">Loading student records...</div>
            <span className="text-xs">Please wait while we retrieve the data.</span>
          </div>
        ) : (
          <>
            {/* Student Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-(--button-green) w-full" />
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</span>
                    <span className="text-base font-semibold text-slate-900">
                      {student.name || `${student.fname} ${student.lname}`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">LRN</span>
                    <span className="text-base font-mono font-medium text-slate-700">{student.lrn_number}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sex</span>
                    <span className="text-base font-medium text-slate-700">{student.sex}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grade & Section</span>
                    <span className="text-base font-medium text-slate-700">{student.gradeSection}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">School Year</span>
                    <span className="text-base font-medium text-slate-700">{student.schoolYear}</span>
                  </div>
                  {subjectFilter ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selected Subject</span>
                      <span className="text-base font-medium text-slate-700">{subjectFilter.subject_name}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 border border-gray-300">Learning Areas</th>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 border border-gray-300">Q1</th>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 border border-gray-300">Q2</th>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 border border-gray-300">Q3</th>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 border border-gray-300">Q4</th>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 border border-gray-300">Final Grade</th>
                      <th className="px-6 py-3 text-center text-sm font-bold text-gray-900 border border-gray-300">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectRows.length > 0 ? (
                      subjectRows.map((subjectData) => (
                        <tr key={subjectData.srs_id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-left border border-gray-300 font-medium">{subjectData.subject_name}</td>
                          <td className="px-6 py-3 text-center border border-gray-300">{subjectData?.q1_grade ?? ''}</td>
                          <td className="px-6 py-3 text-center border border-gray-300">{subjectData?.q2_grade ?? ''}</td>
                          <td className="px-6 py-3 text-center border border-gray-300">{subjectData?.q3_grade ?? ''}</td>
                          <td className="px-6 py-3 text-center border border-gray-300">{subjectData?.q4_grade ?? ''}</td>
                          <td className="px-6 py-3 text-center border border-gray-300 font-semibold">{subjectData?.avg_grade ?? ''}</td>
                          <td className="px-6 py-3 text-center border border-gray-300">
                            <span className={`font-semibold ${
                              subjectData?.remarks === 'PASSED' ? 'text-(--button-green)' : 
                              subjectData?.remarks === 'FAILED' ? 'text-(--status-denied)' : 'text-gray-500'
                            }`}>
                              {subjectData?.remarks ?? ''}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-6 text-center text-gray-500 border border-gray-300">No records found.</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-left border border-gray-300">General Average</td>
                      <td colSpan={4} className="border border-gray-300"></td>
                      <td className="px-6 py-3 text-center border border-gray-300 text-lg">{generalAverage}</td>
                      <td className="px-6 py-3 text-center border border-gray-300">
                        <span className={generalRemarks === 'PASSED' ? 'text-(--button-green)' : 'text-(--status-denied)'}>
                          {generalRemarks}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attendance Records */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-6 py-3 border-b border-gray-300 text-center font-bold">Attendance Records</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-225">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 border border-gray-300"></th>
                      {months.map(m => <th key={m} className="px-4 py-3 border border-gray-300 font-bold">{m}</th>)}
                      <th className="px-4 py-3 border border-gray-300 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3 border border-gray-300 font-semibold bg-gray-50">School Days</td>
                      {months.map(m => <td key={m} className="px-4 py-3 text-center border border-gray-300">{attendanceMap[m]?.school_days || 0}</td>)}
                      <td className="px-4 py-3 text-center border border-gray-300 font-bold">{totalSchoolDays}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border border-gray-300 font-semibold bg-gray-50">Present</td>
                      {months.map(m => <td key={m} className="px-4 py-3 text-center border border-gray-300">{attendanceMap[m]?.days_present || 0}</td>)}
                      <td className="px-4 py-3 text-center border border-gray-300 font-bold">{totalPresent}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 border border-gray-300 font-semibold bg-gray-50">Absent</td>
                      {months.map(m => <td key={m} className="px-4 py-3 text-center border border-gray-300">{attendanceMap[m]?.days_absent || 0}</td>)}
                      <td className="px-4 py-3 text-center border border-gray-300 font-bold">{totalAbsent}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grading Scale Legend */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-bold mb-2">Description</h4>
                  <ul className="space-y-1"><li>Outstanding</li><li>Very Satisfactory</li><li>Satisfactory</li><li>Fairly Satisfactory</li><li>Did Not Meet Expectations</li></ul>
                </div>
                <div className="text-center">
                  <h4 className="font-bold mb-2">Grading Scale</h4>
                  <ul className="space-y-1"><li>90 - 100</li><li>85 - 89</li><li>80 - 84</li><li>75 - 79</li><li>Below 75</li></ul>
                </div>
                <div className="text-center">
                  <h4 className="font-bold mb-2">Remarks</h4>
                  <ul className="space-y-1 font-semibold">
                    <li className="text-(--button-green)">Passed</li><li className="text-(--button-green)">Passed</li><li className="text-(--button-green)">Passed</li><li className="text-(--button-green)">Passed</li><li className="text-(--status-denied)">Failed</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
