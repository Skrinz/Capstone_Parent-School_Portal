import { apiFetch, bearerHeaders } from "./base";

export interface ManagedSubject {
  subject_id: number;
  name: string;
  created_at: string;
  grade_levels: Array<{
    gl_id: number;
    grade_level: {
      gl_id: number;
      grade_level: string;
    };
  }>;
}

export interface GradeLevelOption {
  gl_id: number;
  grade_level: string;
}

export const subjectsApi = {
  getAllSubjects: async () => {
    return apiFetch<{ data: ManagedSubject[] }>("/predefined-subjects", {
      method: "GET",
      headers: bearerHeaders(),
    });
  },

  createSubject: async (name: string) => {
    return apiFetch<{ data: ManagedSubject }>("/predefined-subjects/subjects", {
      method: "POST",
      successMessage: "Subject added successfully.",
      headers: {
        ...bearerHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  },

  archiveSubject: async (subjectId: number) => {
    return apiFetch<void>(`/predefined-subjects/subjects/${subjectId}`, {
      method: "DELETE",
      successMessage: "Subject archived successfully.",
      headers: bearerHeaders(),
    });
  },

  getArchivedSubjects: async () => {
    return apiFetch<{ data: ManagedSubject[] }>("/predefined-subjects/archived", {
      method: "GET",
      headers: bearerHeaders(),
    });
  },

  unarchiveSubject: async (subjectId: number) => {
    return apiFetch<void>(`/predefined-subjects/subjects/${subjectId}/unarchive`, {
      method: "PUT",
      successMessage: "Subject restored successfully.",
      headers: bearerHeaders(),
    });
  },

  assignSubjectToGradeLevel: async (gradeLevelId: number, subjectId: number) => {
    return apiFetch(`/predefined-subjects/grade-levels/${gradeLevelId}`, {
      method: "POST",
      successMessage: "Subject assigned successfully.",
      headers: {
        ...bearerHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject_id: subjectId }),
    });
  },

  assignSubjectsToGradeLevel: async (gradeLevelId: number, subjectIds: number[]) => {
    return Promise.all(
      subjectIds.map((subjectId) =>
        apiFetch(`/predefined-subjects/grade-levels/${gradeLevelId}`, {
          method: "POST",
          skipSuccessFeedback: true,
          headers: {
            ...bearerHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subject_id: subjectId }),
        }),
      ),
    );
  },

  removeSubjectFromGradeLevel: async (gradeLevelId: number, subjectId: number) => {
    return apiFetch<void>(
      `/predefined-subjects/grade-levels/${gradeLevelId}/subjects/${subjectId}`,
      {
        method: "DELETE",
        successMessage: "Subject unassigned successfully.",
        headers: bearerHeaders(),
      },
    );
  },

  unassignSubjectsFromGradeLevel: async (gradeLevelId: number, subjectIds: number[]) => {
    return Promise.all(
      subjectIds.map((subjectId) =>
        apiFetch<void>(
          `/predefined-subjects/grade-levels/${gradeLevelId}/subjects/${subjectId}`,
          {
            method: "DELETE",
            skipSuccessFeedback: true,
            headers: bearerHeaders(),
          },
        ),
      ),
    );
  },

  getGradeLevels: async () => {
    return apiFetch<{ data: GradeLevelOption[] }>("/classes/grade-levels/all", {
      method: "GET",
      headers: bearerHeaders(),
    });
  },
};
