import { create } from "zustand";
import { libraryApi, type GetMaterialsParams, type GetBorrowHistoryParams } from "../api/libraryApi";
import type { 
  LearningMaterial, 
  LibraryCategory, 
  LibrarySubject,
  BorrowerLookupResult,
  BorrowRecord, 
  PaginationMeta,
  MaterialStatus
} from "../api/types";

// --- Constants ---

export const GRADE_LEVELS = [
  { id: 1, label: "Kindergarten" },
  { id: 2, label: "Grade 1" },
  { id: 3, label: "Grade 2" },
  { id: 4, label: "Grade 3" },
  { id: 5, label: "Grade 4" },
  { id: 6, label: "Grade 5" },
  { id: 7, label: "Grade 6" },
];

export function formatGradeLevel(glId: number): string {
  const found = GRADE_LEVELS.find((g) => g.id === glId);
  return found ? found.label : `Grade ${glId}`;
}

// --- Store ---

interface LibraryState {
  materials: LearningMaterial[];
  books: LearningMaterial[];
  learningResources: LearningMaterial[];
  categories: LibraryCategory[];
  subjects: LibrarySubject[];
  borrowHistory: BorrowRecord[];
  
  loading: boolean;
  borrowersLoading: boolean;
  
  materialsPagination: PaginationMeta | null;
  historyPagination: PaginationMeta | null;

  // Actions
  fetchMaterials: (params?: GetMaterialsParams) => Promise<void>;
  fetchBooks: () => Promise<void>;
  fetchLearningResources: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSubjects: () => Promise<void>;
  createMaterial: (data: Partial<LearningMaterial>) => Promise<void>;
  updateMaterial: (id: number, data: Partial<LearningMaterial>) => Promise<void>;
  deleteMaterial: (id: number) => Promise<void>;
  createBook: (data: { item_name: string; author?: string; subject_id: number; gl_id: number }) => Promise<void>;
  updateBook: (id: number, data: { item_name: string; author?: string; subject_id: number; gl_id: number }) => Promise<void>;
  createLearningResource: (data: { item_name: string; category_id: number; gl_id: number }) => Promise<void>;
  updateLearningResource: (id: number, data: { item_name: string; category_id: number; gl_id: number }) => Promise<void>;
  
  createCategory: (name: string) => Promise<void>;
  updateCategory: (categoryId: number, name: string) => Promise<void>;
  
  addCopy: (id: number, data: { copy_code: number; condition?: string }) => Promise<void>;
  updateCopyStatus: (copyId: number, data: { status: MaterialStatus; condition?: string }) => Promise<void>;
  
  borrowMaterial: (data: { copy_id: number; student_id?: number; user_id?: number; due_at?: string }) => Promise<void>;
  returnMaterial: (borrowId: number, data: { penalty_cost?: number; remarks?: string }) => Promise<void>;
  fetchBorrowHistory: (params?: GetBorrowHistoryParams) => Promise<void>;
  lookupBorrowers: (query: string) => Promise<BorrowerLookupResult[]>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  materials: [],
  books: [],
  learningResources: [],
  categories: [],
  subjects: [],
  borrowHistory: [],
  loading: false,
  borrowersLoading: false,
  materialsPagination: null,
  historyPagination: null,

  fetchMaterials: async (params) => {
    set({ loading: true });
    try {
      const res = await libraryApi.getAllMaterials(params);
      set({
        materials: res.data,
        books: res.data.filter((material) => material.item_type === "Book"),
        learningResources: res.data.filter((material) => material.item_type === "Learning_Resource"),
        materialsPagination: res.pagination,
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchBooks: async () => {
    set({ loading: true });
    try {
      const res = await libraryApi.getAllMaterials({ item_type: "Book" });
      set({
        materials: res.data,
        books: res.data,
        learningResources: [],
        materialsPagination: res.pagination,
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchLearningResources: async () => {
    set({ loading: true });
    try {
      const res = await libraryApi.getAllMaterials({ item_type: "Learning_Resource" });
      set({
        materials: res.data,
        books: [],
        learningResources: res.data,
        materialsPagination: res.pagination,
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const res = await libraryApi.getAllCategories();
      set({ categories: res.data });
    } finally {
      set({ loading: false });
    }
  },

  fetchSubjects: async () => {
    set({ loading: true });
    try {
      const res = await libraryApi.getAllSubjects();
      set({ subjects: res.data });
    } finally {
      set({ loading: false });
    }
  },

  createMaterial: async (data) => {
    await libraryApi.createMaterial(data);
    await get().fetchMaterials();
  },

  updateMaterial: async (id, data) => {
    await libraryApi.updateMaterial(id, data);
    await get().fetchMaterials();
  },

  deleteMaterial: async (id) => {
    await libraryApi.deleteMaterial(id);
    await get().fetchMaterials();
  },

  createBook: async (data) => {
    let categories = get().categories;
    if (categories.length === 0) {
      await get().fetchCategories();
      categories = get().categories;
    }

    const defaultBookCategoryId =
      categories.find((category) =>
        ["books", "book", "textbooks", "textbook"].includes(
          category.category_name.trim().toLowerCase(),
        ),
      )?.category_id ??
      categories[0]?.category_id;

    if (!defaultBookCategoryId) {
      throw new Error("Create at least one category before adding books.");
    }

    await libraryApi.createMaterial({
      item_name: data.item_name,
      author: data.author,
      item_type: "Book",
      category_id: defaultBookCategoryId,
      subject_id: data.subject_id,
      gl_id: data.gl_id,
    });
    await get().fetchBooks();
  },

  updateBook: async (id, data) => {
    await libraryApi.updateMaterial(id, {
      item_name: data.item_name,
      author: data.author,
      subject_id: data.subject_id,
      gl_id: data.gl_id,
    });
    await get().fetchBooks();
  },

  createLearningResource: async (data) => {
    await libraryApi.createMaterial({
      item_name: data.item_name,
      category_id: data.category_id,
      gl_id: data.gl_id,
      item_type: "Learning_Resource",
    });
    await get().fetchLearningResources();
  },

  updateLearningResource: async (id, data) => {
    await libraryApi.updateMaterial(id, {
      item_name: data.item_name,
      category_id: data.category_id,
      gl_id: data.gl_id,
    });
    await get().fetchLearningResources();
  },

  createCategory: async (category_name) => {
    await libraryApi.createCategory({ category_name });
    await get().fetchCategories();
  },

  updateCategory: async (categoryId, category_name) => {
    await libraryApi.updateCategory(categoryId, { category_name });
    await get().fetchCategories();
  },

  addCopy: async (id, data) => {
    await libraryApi.addCopy(id, data);
    await get().fetchMaterials();
  },

  updateCopyStatus: async (copyId, data) => {
    await libraryApi.updateCopyStatus(copyId, data);
    await get().fetchMaterials();
  },

  borrowMaterial: async (data) => {
    await libraryApi.borrowMaterial(data);
    await get().fetchMaterials();
  },

  returnMaterial: async (borrowId, data) => {
    await libraryApi.returnMaterial(borrowId, data);
    await get().fetchBorrowHistory();
    await get().fetchMaterials();
  },

  fetchBorrowHistory: async (params) => {
    set({ loading: true });
    try {
      const res = await libraryApi.getBorrowHistory(params);
      set({ borrowHistory: res.data, historyPagination: res.pagination });
    } finally {
      set({ loading: false });
    }
  },

  lookupBorrowers: async (query) => {
    set({ borrowersLoading: true });
    try {
      const res = await libraryApi.lookupBorrowers(query);
      return res.data;
    } finally {
      set({ borrowersLoading: false });
    }
  },
}));
