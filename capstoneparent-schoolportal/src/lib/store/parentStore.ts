import { create } from "zustand";
import { parentsApi, type ParentChild, type ParentRegistrationEntry } from "../api/parentsApi";

interface ParentState {
  children: ParentChild[];
  registrations: ParentRegistrationEntry[];
  activeChild: ParentChild | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchChildren: () => Promise<void>;
  fetchMyRegistrations: () => Promise<void>;
  setActiveChild: (child: ParentChild | null) => void;
  submitRegistration: (data: FormData) => Promise<void>;
  resubmitRegistration: (prId: number, data: FormData) => Promise<void>;
}

export const useParentStore = create<ParentState>((set, get) => ({
  children: [],
  registrations: [],
  activeChild: null,
  loading: false,
  error: null,

  fetchChildren: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch verified children and all registration history in parallel
      const [childrenRes, registrationsRes] = await Promise.allSettled([
        parentsApi.getMyChildren(),
        parentsApi.getMyRegistrations(),
      ]);

      const children =
        childrenRes.status === "fulfilled" ? childrenRes.value.data : [];
      const registrations =
        registrationsRes.status === "fulfilled"
          ? registrationsRes.value.data
          : [];

      set({ children, registrations });

      // If there's only one verified child, set it as active by default
      if (children.length === 1 && !get().activeChild) {
        set({ activeChild: children[0] });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch data" });
    } finally {
      set({ loading: false });
    }
  },

  fetchMyRegistrations: async () => {
    try {
      const res = await parentsApi.getMyRegistrations();
      set({ registrations: res.data });
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch registrations" });
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

  resubmitRegistration: async (prId: number, data: FormData) => {
    set({ loading: true, error: null });
    try {
      await parentsApi.resubmitRegistration(prId, data);
      await get().fetchChildren();
    } catch (err: any) {
      set({ error: err.message || "Failed to resubmit registration" });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
