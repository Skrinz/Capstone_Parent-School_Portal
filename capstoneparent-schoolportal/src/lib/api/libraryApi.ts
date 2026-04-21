/**
 * src/lib/api/libraryApi.ts
 */

import { apiFetch, bearerHeaders } from "./base";
import type {
  ApiData,
  ApiPaginatedData,
  LearningMaterial,
  MaterialCopy,
  BorrowRecord,
  LibraryCategory,
  LibrarySubject,
  BorrowerLookupResult,
  ItemType,
  MaterialStatus,
} from "./types";

export interface GetMaterialsParams {
  page?: number;
  limit?: number;
  item_type?: ItemType;
  category_id?: number | string;
  grade_level?: number | string;
  subject_id?: number | string;
}

export interface GetBorrowHistoryParams {
  page?: number;
  limit?: number;
  student_id?: number;
  user_id?: number;
  status?: "borrowed" | "returned" | "overdue" | string;
  copy_status?: MaterialStatus;
}

export const libraryApi = {
  // Materials
  getAllMaterials: (params?: GetMaterialsParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== "all") {
          query.append(key, String(value));
        }
      });
    }
    return apiFetch<ApiPaginatedData<LearningMaterial>>(`/library/materials?${query.toString()}`, {
      headers: bearerHeaders(),
    });
  },

  getMaterialById: (id: number) =>
    apiFetch<ApiData<LearningMaterial>>(`/library/materials/${id}`, {
      headers: bearerHeaders(),
    }),

  createMaterial: (data: Partial<LearningMaterial>) =>
    apiFetch<ApiData<LearningMaterial>>("/library/materials", {
      method: "POST",
      headers: { ...bearerHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
      successMessage: "Material created successfully",
    }),

  updateMaterial: (id: number, data: Partial<LearningMaterial>) =>
    apiFetch<ApiData<LearningMaterial>>(`/library/materials/${id}`, {
      method: "PUT",
      headers: { ...bearerHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
      successMessage: "Material updated successfully",
    }),

  deleteMaterial: (id: number) =>
    apiFetch<{ message: string }>(`/library/materials/${id}`, {
      method: "DELETE",
      headers: bearerHeaders(),
      successMessage: "Material deleted successfully",
    }),

  // Copies
  addCopy: (id: number, data: { copy_code: number; condition?: string }) =>
    apiFetch<ApiData<MaterialCopy>>(`/library/materials/${id}/copies`, {
      method: "POST",
      headers: { ...bearerHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
      successMessage: "Copy added successfully",
    }),

  updateCopyStatus: (
    copyId: number,
    data: { status: MaterialStatus; condition?: string }
  ) =>
    apiFetch<ApiData<MaterialCopy>>(`/library/copies/${copyId}/status`, {
      method: "PATCH",
      headers: { ...bearerHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
      successMessage: "Copy status updated successfully",
    }),

  // Borrow & Return
  borrowMaterial: (data: { copy_id: number; student_id?: number; user_id?: number; due_at?: string }) =>
    apiFetch<ApiData<BorrowRecord>>("/library/borrow", {
      method: "POST",
      headers: { ...bearerHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
      successMessage: "Material borrowed successfully",
    }),

  returnMaterial: (borrowId: number, data: { penalty_cost?: number; remarks?: string }) =>
    apiFetch<ApiData<BorrowRecord>>(`/library/borrow/${borrowId}/return`, {
      method: "PATCH",
      headers: { ...bearerHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
      successMessage: "Material returned successfully",
    }),

  getBorrowHistory: (params?: GetBorrowHistoryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== "all") {
          query.append(key, String(value));
        }
      });
    }
    return apiFetch<ApiPaginatedData<BorrowRecord>>(
      `/library/borrow/history?${query.toString()}`,
      { headers: bearerHeaders() }
    );
  },

  // Categories
  getAllCategories: () =>
    apiFetch<ApiData<LibraryCategory[]>>("/library/categories", {
      headers: bearerHeaders(),
    }),

  getAllSubjects: () =>
    apiFetch<ApiData<LibrarySubject[]>>("/library/subjects", {
      headers: bearerHeaders(),
    }),

  lookupBorrowers: (query: string) =>
    apiFetch<ApiData<BorrowerLookupResult[]>>(
      `/library/borrowers/lookup?q=${encodeURIComponent(query)}`,
      { headers: bearerHeaders() }
    ),

  createCategory: (data: { category_name: string }) =>
    apiFetch<ApiData<LibraryCategory>>("/library/categories", {
      method: "POST",
      headers: { ...bearerHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
      successMessage: "Category created successfully",
    }),

  updateCategory: (categoryId: number, data: { category_name: string }) =>
    apiFetch<ApiData<LibraryCategory>>(`/library/categories/${categoryId}`, {
      method: "PUT",
      headers: { ...bearerHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
      successMessage: "Category updated successfully",
    }),
};
