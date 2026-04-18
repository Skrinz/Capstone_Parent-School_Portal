import { apiFetch, bearerHeaders, resolveMediaUrl } from "./base";
import type { ApiData, PaginationMeta } from "./types";

export type ParentRegistrationStatus = "PENDING" | "VERIFIED" | "DENIED";

export interface BackendParentRegistrationFile {
  file: {
    file_id: number;
    file_name: string;
    file_path: string | null;
  };
}

export interface BackendParentRegistrationStudent {
  student: {
    student_id: number;
    fname: string;
    lname: string;
    lrn_number: string;
    grade_level?: {
      gl_id?: number;
      grade_level: string;
    } | null;
  };
}

export interface BackendParentRegistration {
  pr_id: number;
  parent_id: number;
  status: ParentRegistrationStatus;
  remarks?: string | null;
  submitted_at: string;
  verified_at?: string | null;
  verified_by?: number | null;
  parent: {
    user_id: number;
    fname: string;
    lname: string;
    email: string;
    contact_num: string;
    address?: string | null;
  };
  students: BackendParentRegistrationStudent[];
  files: BackendParentRegistrationFile[];
  verifier?: {
    user_id: number;
    fname: string;
    lname: string;
  } | null;
}

export interface ParentRegistrationsResponse {
  data: BackendParentRegistration[];
  pagination: PaginationMeta;
}

export interface VerifyRegistrationPayload {
  status: "VERIFIED" | "DENIED";
  remarks?: string;
}

export interface VerifyRegistrationOptions {
  skipSuccessFeedback?: boolean;
}

export const parentsApi = {
  getRegistrations(status?: ParentRegistrationStatus | "all") {
    const params = new URLSearchParams({
      page: "1",
      limit: "100",
    });

    if (status && status !== "all") {
      params.set("status", status);
    }

    return apiFetch<ParentRegistrationsResponse>(`/parents/registrations?${params.toString()}`, {
      method: "GET",
      headers: bearerHeaders(),
    });
  },

  getRegistrationById(id: number) {
    return apiFetch<ApiData<BackendParentRegistration>>(`/parents/registrations/${id}`, {
      method: "GET",
      headers: bearerHeaders(),
    });
  },

  verifyRegistration(
    id: number,
    payload: VerifyRegistrationPayload,
    options: VerifyRegistrationOptions = {},
  ) {
    return apiFetch<ApiData<BackendParentRegistration>>(`/parents/registrations/${id}/verify`, {
      method: "PATCH",
      skipSuccessFeedback: options.skipSuccessFeedback,
      headers: {
        ...bearerHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },
};

export function normalizeRegistration(registration: BackendParentRegistration) {
  const parentName = `${registration.parent.fname} ${registration.parent.lname}`.trim();

  return {
    id: registration.pr_id,
    parentName,
    contactNumber: registration.parent.contact_num,
    address: registration.parent.address ?? "",
    studentNames: registration.students.map(({ student }) => {
      const fullName = `${student.fname} ${student.lname}`.trim();
      return student.lrn_number ? `${fullName} (${student.lrn_number})` : fullName;
    }),
    status: registration.status,
    submittedAt: registration.submitted_at,
    remarks: registration.remarks ?? "",
    uploadedFiles: registration.files.map(({ file }) => ({
      name: file.file_name,
      filePath: file.file_path ? resolveMediaUrl(file.file_path) : undefined,
    })),
  };
}
