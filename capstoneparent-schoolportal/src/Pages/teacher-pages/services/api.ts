import type { ClassItem, SubjectItem, Student } from '@/Pages/teacher-pages/types';
import type { SectionItem } from '@/Pages/principal-pages/types';
import { apiFetch, bearerHeaders } from '@/lib/api/base';

const mapStudent = (item: any): Student => {
  const getNumericGrade = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const subjectRecords = (item.subject_records ?? []).map((record: any) => ({
    ...record,
    subject_name: record.subject_name ?? record.subject_record?.subject_name ?? '',
    q1_grade: getNumericGrade(record.q1_grade),
    q2_grade: getNumericGrade(record.q2_grade),
    q3_grade: getNumericGrade(record.q3_grade),
    q4_grade: getNumericGrade(record.q4_grade),
    avg_grade: getNumericGrade(record.avg_grade),
    remarks: record.remarks ?? '',
  }));

  const numericAverages = subjectRecords
    .map((record: any) => record.avg_grade)
    .filter((grade: number) => Number.isFinite(grade));

  const computedFinalAverage = numericAverages.length > 0
    ? Math.round(
        (numericAverages.reduce((sum: number, grade: number) => sum + grade, 0) /
          numericAverages.length) *
          100,
      ) / 100
    : 'N/A';

  const computedRemarks =
    numericAverages.length > 0
      ? numericAverages.every((grade: number) => grade >= 75)
        ? 'PASSED'
        : 'FAILED'
      : 'N/A';

  return {
    ...item,
    name: `${item.fname} ${item.lname}`,
    lrn: item.lrn_number,
    schoolYear: `${item.syear_start} - ${item.syear_end}`,
    gradeSection: item.section_name
      ? `${item.grade_level?.grade_level || ''} - ${item.section_name}`
      : item.grade_level?.grade_level || '',
    clist_id: item.clist_id ?? item.class_lists?.[0]?.clist_id ?? null,
    subject_records: subjectRecords,
    attendance_records: item.attendance_records ?? [],
    finalAvgGrade: item.finalAvgGrade ?? computedFinalAverage,
    remarks: item.remarks ?? computedRemarks,
  };
};

export const fetchClasses = async (): Promise<ClassItem[]> => {
  try {
    const response = await apiFetch<{ data: any[] }>('/classes/teacher/list', {
      headers: bearerHeaders(),
    });
    return response.data.map(item => ({
      ...item,
      grade: item.grade_level?.grade_level,
      section_name: item.section?.section_name,
      student_count: item._count?.students || 0
    }));
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
};

export const fetchSubjects = async (): Promise<SubjectItem[]> => {
  try {
    const response = await apiFetch<{ data: any[] }>('/classes/subjects/teacher', {
      headers: bearerHeaders(),
    });
    return response.data.map((item) => {
      const firstClass = item.class_lists && item.class_lists.length > 0
        ? item.class_lists[0].class_list
        : null;

      return {
        ...item,
        studentCount: item.students?.length ?? 0,
        grade: firstClass?.grade_level?.grade_level || '',
        section: firstClass?.section?.section_name || '',
        syear_start: firstClass?.syear_start ?? undefined,
        syear_end: firstClass?.syear_end ?? undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
};

export const fetchStudents = async (clist_id?: number): Promise<Student[]> => {
  try {
    const searchParams = new URLSearchParams({ limit: '1000' });
    if (clist_id) {
      searchParams.set('clist_id', String(clist_id));
    }

    const endpoint = `/students?${searchParams.toString()}`;
    const response = await apiFetch<{ data: any[] }>(endpoint, {
      headers: bearerHeaders(),
    });
    return response.data.map(mapStudent);
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const fetchStudentById = async (studentId: number): Promise<Student> => {
  const response = await apiFetch<{ data: any }>(`/students/${studentId}`, {
    headers: bearerHeaders(),
  });
  return mapStudent(response.data);
};

export const fetchSections = async (): Promise<SectionItem[]> => {
  try {
    const response = await apiFetch<{ data: any[] }>('/classes/sections/all', {
      headers: bearerHeaders(),
    });
    return response.data.map((item) => ({
      id: item.section_id,
      name: item.section_name,
    }));
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
};

export const fetchGradeLevels = async (): Promise<any[]> => {
  try {
    const response = await apiFetch<{ data: any[] }>('/classes/grade-levels/all', {
      headers: bearerHeaders(),
    });
    return response.data.map((item) => ({
      id: item.gl_id,
      name: item.grade_level,
    }));
  } catch (error) {
    console.error('Error fetching grade levels:', error);
    return [];
  }
};
