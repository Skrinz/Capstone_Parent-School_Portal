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

const API_BASE_URL = '/api';

// ==================== API FUNCTIONS ====================

export const fetchClasses = async (page = 1, limit = 10): Promise<PaginatedResponse<ClassItem>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/classes?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch classes');
    const result = await response.json();
    
    // Map backend to frontend types
    const mappedData = result.data.map((item: any) => ({
      id: item.clist_id,
      grade: item.grade_level?.grade_level || 'Unknown',
      section: item.section?.section_name || 'No Section',
      start_year: item.syear_start,
      end_year: item.syear_end,
      teacher_id: item.adviser?.user_id,
      teacher_name: item.adviser ? `${item.adviser.fname} ${item.adviser.lname}` : undefined
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
    const response = await fetch(`${API_BASE_URL}/classes/subjects/all?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch subjects');
    const result = await response.json();

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
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch students');
    const result = await response.json();

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
    const response = await fetch(
      `${API_BASE_URL}/students/lookup?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error('Failed to search students');
    const result = await response.json();

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
    const response = await fetch(`${API_BASE_URL}/classes/sections/all`);
    if (!response.ok) throw new Error('Failed to fetch sections');
    const result = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/classes/grade-levels/all`);
    if (!response.ok) throw new Error('Failed to fetch grade levels');
    const result = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/users?role=Teacher&limit=1000`);
    if (!response.ok) throw new Error('Failed to fetch teachers');
    const result = await response.json();
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
        const response = await fetch(`${API_BASE_URL}/classes/${classId}/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject_name: subjectName }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.message || 'Failed to add subject');
        }

        const result = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData), 
    });
    if (!response.ok) throw new Error('Failed to add class');
    const result = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classData),
    });
    if (!response.ok) throw new Error('Failed to update class');
    const result = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/classes/subjects/${subjectId}/assign-teacher`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: teacherId }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message || 'Failed to assign teacher');
    }

    const result = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove subject');
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
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message || 'Failed to add student');
    }
    const result = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message || 'Failed to remove student');
    }
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
    const response = await fetch(`${API_BASE_URL}/classes/${classId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_adviser: teacherId }),
    });
    if (!response.ok) throw new Error('Failed to assign class adviser');
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error assigning class adviser:', error);
    throw error;
  }
};
