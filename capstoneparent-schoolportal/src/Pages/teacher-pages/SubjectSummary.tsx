import { useMemo } from 'react';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { Student, SubjectItem } from '@/Pages/teacher-pages/types';

interface SubjectSummaryProps {
  subject: SubjectItem;
  students: Student[];
}

export const SubjectSummary = ({ subject, students }: SubjectSummaryProps) => {
  
  // Calculate passing rate per quarter for this specific subject
  const quarterlyStats = useMemo(() => {
    const quarterKeys = ['q1_grade', 'q2_grade', 'q3_grade', 'q4_grade'] as const;
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    return quarterKeys.map((qKey, index) => {
      let totalGraded = 0;
      let passedCount = 0;

      students.forEach((student) => {
        // Find the grade for this specific subject
        const subjectGrade = student.subject_records?.find(
          (sg) => sg.subject_name === subject.subject_name || sg.srecord_id === subject.srecord_id
        );

        if (!subjectGrade) return;

        // Check if this quarter has a grade
        const quarterGrade = (subjectGrade as any)[qKey];
        if (quarterGrade !== undefined && quarterGrade !== null) {
          totalGraded++;
          
          // Check if passed (grade >= 75)
          if (typeof quarterGrade === 'number' && quarterGrade >= 75) {
            passedCount++;
          }
        }
      });

      const rate = totalGraded > 0 ? Math.round((passedCount / totalGraded) * 100) : 0;

      // Determine color
      let color = '#9CA3AF'; // Gray for N/A
      if (totalGraded > 0) {
        if (rate >= 75) color = '#4DA660';      // Green
        else if (rate >= 50) color = '#F59E0B'; // Orange
        else color = '#dc2626';                 // Red
      }

      return {
        quarter: labels[index],
        passingRate: rate,
        totalStudents: students.length,
        passedStudents: passedCount,
        color,
      };
    });
  }, [students, subject.subject_name, subject.srecord_id]);

  // Calculate average grade per quarter for this subject
  const quarterAverages = useMemo(() => {
    const quarterKeys = ['q1_grade', 'q2_grade', 'q3_grade', 'q4_grade'] as const;
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    return quarterKeys.map((qKey, index) => {
      const grades: number[] = [];

      students.forEach((student) => {
        const subjectGrade = student.subject_records?.find(
          (sg) => sg.subject_name === subject.subject_name || sg.srecord_id === subject.srecord_id
        );

        if (subjectGrade) {
          const quarterGrade = (subjectGrade as any)[qKey];
          if (typeof quarterGrade === 'number') {
            grades.push(quarterGrade);
          }
        }
      });

      const average = grades.length > 0
        ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
        : 0;

      // Color based on average grade
      let barColor = '#9CA3AF'; // Gray for no data
      if (grades.length > 0) {
        if (average >= 90) barColor = '#4DA660';      // Green (Outstanding)
        else if (average >= 85) barColor = '#10B981'; // Light Green (Very Satisfactory)
        else if (average >= 80) barColor = '#F59E0B'; // Orange (Satisfactory)
        else if (average >= 75) barColor = '#FBBF24'; // Yellow (Fairly Satisfactory)
        else barColor = '#dc2626';                    // Red (Did Not Meet Expectations)
      }

      return {
        quarter: labels[index],
        average,
        barColor,
        studentCount: grades.length,
      };
    });
  }, [students, subject.subject_name, subject.srecord_id]);

  // Calculate overall statistics for this subject
  const overallStats = useMemo(() => {
    let totalWithGrades = 0;
    let passedCount = 0;
    let failedCount = 0;

    students.forEach((student) => {
      const subjectGrade = student.subject_records?.find(
        (sg) => sg.subject_name === subject.subject_name || sg.srecord_id === subject.srecord_id
      );

      if (subjectGrade && subjectGrade.avg_grade !== 'N/A' && subjectGrade.avg_grade !== undefined) {
        totalWithGrades++;
        if (subjectGrade.remarks === 'PASSED') {
          passedCount++;
        } else if (subjectGrade.remarks === 'FAILED') {
          failedCount++;
        }
      }
    });

    return {
      total: students.length,
      withGrades: totalWithGrades,
      passed: passedCount,
      failed: failedCount,
      noGrade: students.length - totalWithGrades,
    };
  }, [students, subject.subject_name, subject.srecord_id]);

  return (
    <div className="p-6 space-y-8">
      {/* Passing Rate per Quarter */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-8">Passing Rate per Quarter</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {quarterlyStats.map((stat) => (
            <div key={stat.quarter} className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                {/* Circular Progress */}
                <svg className="w-32 h-32 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={stat.color}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${
                      stat.passedStudents === 0 && stat.passingRate === 0 
                      ? 2 * Math.PI * 56
                      : 2 * Math.PI * 56 * (1 - stat.passingRate / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.passingRate === 0 && stat.passedStudents === 0 ? 'N/A' : `${stat.passingRate}%`}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {stat.quarter}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Average Grades per Quarter for this Subject */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 text-center mb-6">
          Average Grades for {subject.subject_name}
        </h2>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={quarterAverages}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="quarter" 
                tick={{ fill: '#64748b', fontSize: 14, fontWeight: 500 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 12 }}
                label={{ value: 'Average Grade', angle: -90, position: 'insideLeft', fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px'
                }}
                formatter={(value: any, _name: any, props: any) => {
                    if (value === undefined) return ['', 'Average'];

                    return [
                        `${value} (${props.payload.studentCount} students)`,
                        'Average'
                    ];
                }}
              />
              <Bar 
                dataKey="average" 
                radius={[8, 8, 0, 0]}
                label={{ 
                  position: 'top', 
                  fill: '#64748b',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                {quarterAverages.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.barColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#4DA660] rounded"></div>
            <span className="text-gray-600">Outstanding (90-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#10B981] rounded"></div>
            <span className="text-gray-600">Very Satisfactory (85-89)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#F59E0B] rounded"></div>
            <span className="text-gray-600">Satisfactory (80-84)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FBBF24] rounded"></div>
            <span className="text-gray-600">Fairly Satisfactory (75-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#dc2626] rounded"></div>
            <span className="text-gray-600">Did Not Meet (Below 75)</span>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{overallStats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Passed</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{overallStats.passed}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Failed</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{overallStats.failed}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">No Grade</h3>
          <p className="text-3xl font-bold text-gray-500 mt-2">{overallStats.noGrade}</p>
        </div>
      </div>
    </div>
  );
};