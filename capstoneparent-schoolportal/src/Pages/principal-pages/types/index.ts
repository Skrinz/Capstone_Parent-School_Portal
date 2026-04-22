export interface SectionItem {
  id: number;
  name: string; // e.g., "Section A", "Section B"
}

export interface GradeLevelItem {
  id: number;
  name: string;
}

export interface TeacherItem {
  id: number;
  fname: string;
  lname: string;
  name: string;
}

export interface ClassItem {
  id: number;
  grade: string;
  section: string;
  start_year: number;
  end_year: number;
  teacher_id?: number;
  teacher_name?: string; // Populated from join
  student_count?: number;
}

export interface SubjectItem {
  id: number;
  name: string;
  grade: string;
  section: string;
  start_year: number;
  end_year: number;
  teacher_id?: number;
  teacher_name?: string; // Populated from join
}

export interface Student {
  id: number;
  classId: number | null;
  name: string;
  lrn: string;
}

export interface StudentLookupResult {
  id: number;
  name: string;
  lrn: string;
  grade: string;
  status: string;
}

export interface StudentAddSummary {
  added: number;
  unchanged: number;
  failed: number;
  totalProcessed: number;
  failures: {
    input: string;
    message: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
