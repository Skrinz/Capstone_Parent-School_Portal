export interface SectionItem {
  id: number;
  name: string; // e.g., "Section A", "Section B"
}

export interface TeacherItem {
  id: number;
  name: string;
}

// Update ClassItem to include teacher reference
export interface ClassItem {
  id: number;
  grade: string;
  section: string; //Foreign key to class section
  start_year: number;
  end_year: number;
  teacher_id?: number; // Foreign key to teacher
  teacher_name?: string; // Populated from join
}