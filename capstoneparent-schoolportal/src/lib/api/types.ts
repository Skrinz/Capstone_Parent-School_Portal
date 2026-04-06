/**
 * src/lib/api/types.ts
 */

export interface ApiMessage {
  message: string;
}

export interface ApiData<T> {
  message?: string;
  data: T;
}

export interface ApiList<T> {
  message?: string;
  data: T[];
}

export interface AuthUser {
  user_id: number;
  email: string;
  fname: string;
  lname: string;
  contact_num: string;
  address: string;
  account_status: "Active" | "Inactive";
  created_at: string;
  date_of_birth?: string;
  photo_path?: string;
  roles: { role: string }[];
}

export interface StudentSearchResult {
  student_id: number;
  lrn_number: string;
  fname: string;
  lname: string;
  grade_level: { grade_level: string };
}

export interface GradeLevel {
  gl_id: number;
  grade_level: string;
}

export type StudentStatus =
  | "ENROLLED"
  | "GRADUATED"
  | "TRANSFERRED"
  | "DROPPED"
  | "SUSPENDED";

export interface StudentRecord {
  student_id: number;
  fname: string;
  lname: string;
  sex: "M" | "F";
  lrn_number: string;
  gl_id: number;
  syear_start: number;
  syear_end: number;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
  grade_level?: GradeLevel;
  clist_id?: number | null;
  section_name?: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
