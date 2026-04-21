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
  is_verified: boolean;
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

export interface ApiPaginatedData<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface LibraryCategory {
  category_id: number;
  category_name: string;
}

export interface LibrarySubject {
  subject_id: number;
  name: string;
}

export type ItemType = "Learning_Resource" | "Book";
export type MaterialStatus = "AVAILABLE" | "BORROWED" | "LOST" | "GIVEN";

export interface MaterialCopy {
  copy_id: number;
  item_id: number;
  copy_code: number;
  status: MaterialStatus;
  condition?: string;
  added_at: string;
}

export interface LearningMaterial {
  item_id: number;
  item_name: string;
  author?: string;
  item_type: ItemType;
  category_id: number;
  gl_id: number;
  subject_id?: number | null;
  uploaded_at: string;
  uploaded_by: number;
  category?: LibraryCategory;
  subject?: LibrarySubject | null;
  grade_level?: GradeLevel;
  copies?: MaterialCopy[];
}

export interface BorrowerLookupResult {
  type: "student" | "user";
  id: number;
  display_name: string;
  student_id?: number;
  user_id?: number;
  grade_level?: string | null;
  roles?: string[];
  role_label?: string | null;
  meta?: string | null;
}

export interface BorrowRecord {
  mbr_id: number;
  copy_id: number;
  student_id?: number | null;
  user_id?: number | null;
  penalty_cost: number | string;
  borrowed_at: string;
  due_at: string;
  returned_at?: string | null;
  remarks?: string | null;
  copy?: MaterialCopy & { item?: LearningMaterial };
  student?: { fname: string; lname: string };
  user?: { fname: string; lname: string };
}
