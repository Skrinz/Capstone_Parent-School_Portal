import { create } from "zustand";
import { parentsApi } from "../api/parentsApi";

export interface ParentChild {
  student_id: number;
  fname: string;
  lname: string;
  lrn_number: string;
  grade_level?: {
    grade_level: string;
  };
  section?: {
    section_name: string;
  };
  syear_start?: number;
  syear_end?: number;
}

interface ParentState {
  children: ParentChild[];
  activeChild: ParentChild | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchChildren: () => Promise<void>;
  setActiveChild: (child: ParentChild | null) => void;
  submitRegistration: (data: FormData) => Promise<void>;
}

export const useParentStore = create<ParentState>((set, get) => ({
  children: [],
  activeChild: null,
  loading: false,
  error: null,

  fetchChildren: async () => {
    set({ loading: true, error: null });
    try {
      const res = await parentsApi.getMyChildren();
      set({ children: res.data });
      
      // If there's only one child, set it as active by default
      if (res.data.length === 1 && !get().activeChild) {
        set({ activeChild: res.data[0] });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch children" });
    } finally {
      set({ loading: false });
    }
  },

  setActiveChild: (child) => {
    set({ activeChild: child });
  },

  submitRegistration: async (data: FormData) => {
    set({ loading: true, error: null });
    try {
      await parentsApi.submitRegistration(data);
      await get().fetchChildren();
    } catch (err: any) {
      set({ error: err.message || "Failed to submit registration" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
