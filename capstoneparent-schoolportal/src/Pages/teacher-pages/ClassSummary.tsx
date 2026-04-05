import { useMemo } from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer 
} from 'recharts';
import type { ClassSummaryProps } from '@/Pages/teacher-pages/types';

export const ClassSummary = ({ students = [] }: ClassSummaryProps) => {
  
  // Calculate passing rate per quarter
  const quarterlyStats = useMemo(() => {
    const quarterKeys = ['q1_grade', 'q2_grade', 'q3_grade', 'q4_grade'] as const;
    const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    return quarterKeys.map((qKey, index) => {
      // Count students who have grades for this quarter
      let totalGraded = 0;
      let passedCount = 0;

      students.forEach((student) => {
        if (!student.subject_records || student.subject_records.length === 0) return;

        // Check if student has any subject with this quarter's grade
        const hasQuarterGrade = student.subject_records.some(
          (sg: any) => sg[qKey] !== undefined && sg[qKey] !== null
        );

        if (hasQuarterGrade) {
          totalGraded++;

          // Count passed subjects for this quarter
          const quarterSubjects = student.subject_records.filter(
            (sg: any) => sg[qKey] !== undefined && sg[qKey] !== null
          );

          const quarterPassedSubjects = quarterSubjects.filter(
            (sg: any) => {
              const grade = sg[qKey];
              return typeof grade === 'number' && grade >= 75;
            }
          );

          // Student passes the quarter if they passed all subjects
          if (quarterPassedSubjects.length === quarterSubjects.length && quarterSubjects.length > 0) {
            passedCount++;
          }
        }
      });

      const rate = totalGraded > 0 ? Math.round((passedCount / totalGraded) * 100) : 0;

      // Determine color based on data presence and rate
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
  }, [students]);

  // Calculate average grades per subject across all students
  const subjectAverages = useMemo(() => {
    const subjectTotals: Record<string, { sum: number; count: number }> = {};

    students.forEach((student) => {
      if (!student.subject_records) return;

      student.subject_records.forEach((subjectGrade) => {
        const subject = subjectGrade.subject_name || 'Unknown';
        
        // Collect all quarter grades for this subject
        const quarterGrades = [
          subjectGrade.q1_grade,
          subjectGrade.q2_grade,
          subjectGrade.q3_grade,
          subjectGrade.q4_grade,
        ].filter((grade): grade is number => typeof grade === 'number');

        if (quarterGrades.length > 0) {
          if (!subjectTotals[subject]) {
            subjectTotals[subject] = { sum: 0, count: 0 };
          }
          
          // Add all quarter grades
          quarterGrades.forEach((grade) => {
            subjectTotals[subject].sum += grade;
            subjectTotals[subject].count += 1;
          });
        }
      });
    });

    const result = Object.entries(subjectTotals).map(([subject, data]) => ({
      subject,
      average: Math.round(data.sum / data.count),
      fullMark: 100,
    }));

    return result.length > 0 ? result : [
      { subject: 'No Data', average: 0, fullMark: 100 }
    ];
  }, [students]);

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
                      ? 2 * Math.PI * 56 // Full offset (empty) if no data
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

      {/* Average Grades per Subject */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 text-center mb-6">
          Average Grades per Subject
        </h2>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
              cx="50%" 
              cy="50%" 
              outerRadius="80%" // Reduced from 80% to prevent text overlapping container edges
              data={subjectAverages}
            >
              {/* Lighter grid lines for a cleaner look */}
              <PolarGrid stroke="#e2e8f0" /> 
              
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ 
                  fill: '#64748b', 
                  fontSize: 15, 
                  fontWeight: 500 
                }}
              />
              
              <PolarRadiusAxis 
                angle={70}
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={false}
              />
              
              <Radar
                name="Average Grade"
                dataKey="average"
                stroke="#4DA660"
                strokeWidth={2}
                fill="#4DA660"
                fillOpacity={0.3}
                dot={{ r: 2, fill: '#4DA660' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{students.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Overall Passed</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {students.filter(s => s.remarks === 'PASSED').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Overall Failed</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {students.filter(s => s.remarks === 'FAILED').length}
          </p>
        </div>
      </div>
    </div>
  );
};