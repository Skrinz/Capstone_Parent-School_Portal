import type {
  ClassItem,
  SubjectItem,
  Student,
  StudentLookupResult,
  SectionItem,
  TeacherItem,
  GradeLevelItem,
  PaginatedResponse,
} from '@/Pages/principal-pages/types';
import { apiFetch, bearerHeaders } from '@/lib/api/base';

const API_BASE_URL = '';

// ==================== API FUNCTIONS ====================

export const fetchClasses = async (page = 1, limit = 10): Promise<PaginatedResponse<ClassItem>> => {
  try {
    const result = await apiFetch<{ data: any[]; pagination: any }>(
      `/classes?page=${page}&limit=${limit}`,
      { headers: bearerHeaders() }
    );
    
    // Map backend to frontend types
    const mappedData = result.data.map((item: any) => ({
      id: item.clist_id,
      grade: item.grade_level?.grade_level || 'Unknown',
      section: item.section?.section_name || 'No Section',
      start_year: item.syear_start,
      end_year: item.syear_end,
      teacher_id: item.adviser?.user_id,
      teacher_name: item.adviser ? `${item.adviser.fname} ${item.adviser.lname}` : undefined,
      student_count: item._count?.students || 0
    }));

    return {
      data: mappedData,
      pagination: result.pagination
    };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  }
};

export const fetchSubjects = async (page = 1, limit = 100): Promise<PaginatedResponse<SubjectItem>> => {
  try {
    const result = await apiFetch<{ data: any[]; pagination: any }>(
      `/classes/subjects/all?page=${page}&limit=${limit}`,
      { headers: bearerHeaders() }
    );

    const mappedData = result.data.map((item: any) => {
      // Find class info if joined
      const firstClass = item.class_lists && item.class_lists.length > 0 ? item.class_lists[0].class_list : null;
      return {
        id: item.srecord_id,
        name: item.subject_name,
        grade: firstClass?.grade_level?.grade_level || 'N/A',
        section: firstClass?.section?.section_name || 'N/A',
        start_year: firstClass?.syear_start || 0,
        end_year: firstClass?.syear_end || 0,
        teacher_id: item.teacher?.user_id,
        teacher_name: item.teacher ? `${item.teacher.fname} ${item.teacher.lname}` : undefined
      };
    });

    return {
      data: mappedData,
      pagination: result.pagination
    };
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return { data: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } };
  }
};

export const fetchStudents = async (page = 1, limit = 100, classId?: number): Promise<PaginatedResponse<Student>> => {
  try {
    let url = `${API_BASE_URL}/students?page=${page}&limit=${limit}`;
    if (classId) url += `&clist_id=${classId}`;
    
    const result = await apiFetch<{ data: any[]; pagination: any }>(url, {
      headers: bearerHeaders()
    });

    const mappedData = result.data.map((item: any) => ({
      id: item.student_id,
      classId: item.clist_id ?? null,
      name: `${item.fname} ${item.lname}`,
      lrn: item.lrn_number
    }));

    return {
      data: mappedData,
      pagination: result.pagination
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    return { data: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } };
  }
};

export const lookupStudents = async (query: string): Promise<StudentLookupResult[]> => {
  try {
    const result = await apiFetch<{ data: any[] }>(
      `/students/lookup?q=${encodeURIComponent(query)}`,
      { headers: bearerHeaders() }
    );

    return result.data.map((item: any) => ({
      id: item.student_id,
      name: `${item.fname} ${item.lname}`,
      lrn: item.lrn_number,
      grade: item.grade_level?.grade_level || 'Unknown',
      status: item.status,
    }));
  } catch (error) {
    console.error('Error searching students:', error);
    throw error;
  }
};

export const fetchSections = async (): Promise<SectionItem[]> => {
  try {
    const result = await apiFetch<{ data: any[] }>(
      '/classes/sections/all',
      { headers: bearerHeaders() }
    );
    return result.data.map((item: any) => ({
      id: item.section_id,
      name: item.section_name
    }));
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
};

export const fetchGradeLevels = async (): Promise<GradeLevelItem[]> => {
  try {
    const result = await apiFetch<{ data: any[] }>(
      '/classes/grade-levels/all',
      { headers: bearerHeaders() }
    );
    return result.data.map((item: any) => ({
      id: item.gl_id,
      name: item.grade_level
    }));
  } catch (error) {
    console.error('Error fetching grade levels:', error);
    return [];
  }
};

export const fetchTeachers = async (): Promise<TeacherItem[]> => {
  try {
    const result = await apiFetch<{ data: any[] }>(
      '/users?role=Teacher&limit=1000',
      { headers: bearerHeaders() }
    );
    return result.data.map((item: any) => ({
      id: item.user_id,
      fname: item.fname,
      lname: item.lname,
      name: `${item.fname} ${item.lname}`
    }));
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
};

export const addSubjects = async (
  classId: number,
  subjectNames: string[]
): Promise<SubjectItem[]> => {
  try {
    const results = await Promise.all(
      subjectNames.map(async (subjectName) => {
        const result = await apiFetch<{ data: any }>(`/classes/${classId}/subjects`, {
          method: 'POST',
          headers: { 
            ...bearerHeaders(),
            'Content-Type': 'application/json' 
          },
          successMessage: `Subject ${subjectName} added successfully.`,
          body: JSON.stringify({ subject_name: subjectName }),
        });
        return result.data;
      })
    );

    return results;
  } catch (error) {
    console.error('Error adding subjects:', error);
    throw error;
  }
};

// ==================== MUTATIONS ====================

export const addClass = async (classData: {
  gl_id: number;
  section_id: number;
  class_adviser?: number;
  syear_start: number;
  syear_end: number;
}): Promise<ClassItem> => {
  try {
    const result = await apiFetch<{ data: ClassItem }>(`/classes`, {
      method: 'POST',
      headers: { 
        ...bearerHeaders(),
        'Content-Type': 'application/json' 
      },
      successMessage: 'Class added successfully.',
      body: JSON.stringify(classData), 
    });
    return result.data;
  } catch (error) {
    console.error('Error adding class:', error);
    throw error;
  }
};

export const updateClass = async (
  classId: number,
  classData: {
    gl_id?: number;
    section_id?: number;
    class_adviser?: number;
    syear_start?: number;
    syear_end?: number;
  }
): Promise<ClassItem> => {
  try {
    const result = await apiFetch<{ data: ClassItem }>(`/classes/${classId}`, {
      method: 'PUT',
      headers: { 
        ...bearerHeaders(),
        'Content-Type': 'application/json' 
      },
      successMessage: 'Class updated successfully.',
      body: JSON.stringify(classData),
    });
    return result.data;
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

export const assignTeacherToSubject = async (
  subjectId: number,
  teacherId: number
): Promise<SubjectItem> => {
  try {
    const result = await apiFetch<{ data: any }>(`/classes/subjects/${subjectId}/assign-teacher`, {
      method: 'PUT',
      headers: { 
        ...bearerHeaders(),
        'Content-Type': 'application/json' 
      },
      successMessage: 'Teacher assigned successfully.',
      body: JSON.stringify({ teacher_id: teacherId }),
    });
    const item = result.data;
    const firstClass = item.class_lists && item.class_lists.length > 0 ? item.class_lists[0].class_list : null;

    return {
      id: item.srecord_id,
      name: item.subject_name,
      grade: firstClass?.grade_level?.grade_level || 'N/A',
      section: firstClass?.section?.section_name || 'N/A',
      start_year: firstClass?.syear_start || 0,
      end_year: firstClass?.syear_end || 0,
      teacher_id: item.teacher?.user_id,
      teacher_name: item.teacher ? `${item.teacher.fname} ${item.teacher.lname}` : undefined,
    };
  } catch (error) {
    console.error('Error assigning teacher:', error);
    throw error;
  }
};

export const removeSubject = async (subjectId: number): Promise<void> => {
  try {
    await apiFetch<void>(`/subjects/${subjectId}`, {
      method: 'DELETE',
      headers: bearerHeaders(),
      successMessage: 'Subject removed successfully.',
    });
  } catch (error) {
    console.error('Error removing subject:', error);
    throw error;
  }
};

export const addStudentToClass = async (
  classId: number,
  studentData: {
    student_id?: number;
    fname?: string;
    lname?: string;
    sex?: 'M' | 'F';
    lrn_number?: string;
  }
): Promise<Student> => {
  try {
    const result = await apiFetch<{ data: any }>(`/classes/${classId}/students`, {
      method: 'POST',
      headers: { 
        ...bearerHeaders(),
        'Content-Type': 'application/json' 
      },
      successMessage: 'Student added successfully.',
      body: JSON.stringify(studentData),
    });
    return {
      id: result.data.student_id,
      classId,
      name: `${result.data.fname} ${result.data.lname}`,
      lrn: result.data.lrn_number,
    };
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const removeStudentFromClass = async (
  classId: number,
  studentId: number
): Promise<void> => {
  try {
    await apiFetch<void>(`/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
      headers: bearerHeaders(),
      successMessage: 'Student removed successfully.',
    });
  } catch (error) {
    console.error('Error removing student from class:', error);
    throw error;
  }
};

export const assignClassAdviser = async (
  classId: number,
  teacherId: number
): Promise<ClassItem> => {
  try {
    const result = await apiFetch<{ data: ClassItem }>(`/classes/${classId}`, {
      method: 'PUT',
      headers: { 
        ...bearerHeaders(),
        'Content-Type': 'application/json' 
      },
      successMessage: 'Class adviser assigned successfully.',
      body: JSON.stringify({ class_adviser: teacherId }),
    });
    return result.data;
  } catch (error) {
    console.error('Error assigning class adviser:', error);
    throw error;
  }
};
