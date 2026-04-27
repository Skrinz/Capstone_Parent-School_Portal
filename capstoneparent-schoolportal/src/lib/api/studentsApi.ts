/**
 * src/lib/api/students.ts
 */

import { apiFetch, bearerHeaders } from "./base";
import type { ImportSummaryResponse } from "@/lib/importSummary";
import type {
  ApiData,
  ApiList,
  GradeLevel,
  PaginationMeta,
  StudentRecord,
  StudentSearchResult,
  StudentStatus,
} from "./types";

export interface StudentListParams {
  page?: number;
  limit?: number;
  status?: StudentStatus;
  grade_level?: number;
  syear_start?: number;
  search?: string;
}

export interface StudentPayload {
  fname: string;
  lname: string;
  sex: "M" | "F" | "Male" | "Female";
  lrn_number: string;
  gl_id: number;
  syear_start: number;
  syear_end: number;
  status?: StudentStatus;
}

export interface StudentImportTemplateResponse {
  data: {
    downloadUrl: string;
    fileName: string;
  };
}

const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

export const studentsApi = {
  // GET /api/students/search?lrn=...
  searchByLrn(lrn: string) {
    return apiFetch<ApiList<StudentSearchResult>>(
      `/students/search?lrn=${encodeURIComponent(lrn)}`,
      { headers: bearerHeaders() },
    );
  },

  getAll(params: StudentListParams = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.status) searchParams.set("status", params.status);
    if (params.grade_level) {
      searchParams.set("grade_level", String(params.grade_level));
    }
    if (params.syear_start) {
      searchParams.set("syear_start", String(params.syear_start));
    }
    if (params.search) {
      searchParams.set("search", params.search);
    }

    const query = searchParams.toString();

    return apiFetch<{ data: StudentRecord[]; pagination: PaginationMeta }>(
      `/students${query ? `?${query}` : ""}`,
      { headers: bearerHeaders() },
    );
  },

  getById(id: number) {
    return apiFetch<ApiData<StudentRecord>>(`/students/${id}`, {
      headers: bearerHeaders(),
    });
  },

  create(payload: StudentPayload) {
    return apiFetch<ApiData<StudentRecord>>("/students", {
      method: "POST",
      successMessage: "Student added successfully.",
      headers: {
        ...bearerHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  import(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch<ImportSummaryResponse>(
      "/students/import",
      {
        method: "POST",
        successMessage: "Student CSV uploaded successfully.",
        headers: bearerHeaders(),
        body: formData,
      },
    );
  },

  getImportTemplate() {
    return apiFetch<StudentImportTemplateResponse>("/students/import-template", {
      method: "GET",
      headers: bearerHeaders(),
    });
  },

  update(
    id: number,
    payload: Partial<StudentPayload> & { status?: StudentStatus },
  ) {
    return apiFetch<ApiData<StudentRecord>>(`/students/${id}`, {
      method: "PUT",
      successMessage: "Student updated successfully.",
      headers: {
        ...bearerHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  delete(id: number) {
    return apiFetch<{ message: string }>(`/students/${id}`, {
      method: "DELETE",
      successMessage: "Student deleted successfully.",
      headers: bearerHeaders(),
    });
  },

  getGradeLevels() {
    return apiFetch<{ data: GradeLevel[] }>("/classes/grade-levels/all", {
      method: "GET",
      headers: bearerHeaders(),
    });
  },
};

export async function downloadStudentImportTemplate() {
  const response = await studentsApi.getImportTemplate();
  const fileName = response.data.fileName || "StudentList_Template.xlsx";
  const downloadResponse = await fetch(response.data.downloadUrl);

  if (!downloadResponse.ok) {
    throw new Error("Failed to download student import template");
  }

  const blob = await downloadResponse.blob();
  triggerBrowserDownload(blob, fileName);
}
