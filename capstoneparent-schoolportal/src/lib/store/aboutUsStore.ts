import { create } from "zustand";
import { pagesApi } from "@/lib/api/pagesApi";
import {
  DEFAULT_CONTACT_US_CONTENT,
  type ContactUsContent,
} from "@/lib/contactUsContent";
import {
  DEFAULT_HISTORY_CONTENT,
  type HistoryContent,
} from "@/lib/historyContent";
import {
  DEFAULT_ORGANIZATIONAL_CHARTS,
  type OrganizationalChartItem,
} from "@/lib/organizationalChartContent";
import {
  DEFAULT_SCHOOL_CALENDARS,
  type SchoolCalendarItem,
} from "@/lib/schoolCalendarContent";
import {
  DEFAULT_TRANSPARENCY_CONTENT,
  type TransparencyContent,
} from "@/lib/transparencyContent";

type AboutUsSection =
  | "contactUs"
  | "history"
  | "transparency"
  | "schoolCalendars"
  | "orgCharts";

type StoreFeedback = {
  type: "success" | "error";
  message: string;
  section: AboutUsSection;
} | null;

const defaultLoadingState: Record<AboutUsSection, boolean> = {
  contactUs: false,
  history: false,
  transparency: false,
  schoolCalendars: false,
  orgCharts: false,
};

const defaultLoadedState: Record<AboutUsSection, boolean> = {
  contactUs: false,
  history: false,
  transparency: false,
  schoolCalendars: false,
  orgCharts: false,
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

interface AboutUsStore {
  contactUs: ContactUsContent;
  history: HistoryContent;
  transparency: TransparencyContent;
  schoolCalendars: SchoolCalendarItem[];
  orgCharts: OrganizationalChartItem[];
  loading: Record<AboutUsSection, boolean>;
  loaded: Record<AboutUsSection, boolean>;
  feedback: StoreFeedback;
  clearFeedback: () => void;
  fetchContactUs: (force?: boolean) => Promise<ContactUsContent>;
  updateContactUs: (data: ContactUsContent) => Promise<ContactUsContent>;
  fetchHistory: (force?: boolean) => Promise<HistoryContent>;
  updateHistory: (
    data: Partial<HistoryContent>,
    asset?: File,
  ) => Promise<HistoryContent>;
  fetchTransparency: (force?: boolean) => Promise<TransparencyContent>;
  updateTransparency: (asset?: File) => Promise<TransparencyContent>;
  fetchSchoolCalendars: (force?: boolean) => Promise<SchoolCalendarItem[]>;
  updateSchoolCalendar: (
    data: Partial<SchoolCalendarItem>,
    asset?: File,
  ) => Promise<SchoolCalendarItem>;
  fetchOrgCharts: (force?: boolean) => Promise<OrganizationalChartItem[]>;
  updateOrgChart: (
    data: Partial<OrganizationalChartItem>,
    asset?: File,
    originalYear?: string,
  ) => Promise<OrganizationalChartItem>;
}

export const useAboutUsStore = create<AboutUsStore>((set, get) => ({
  contactUs: DEFAULT_CONTACT_US_CONTENT,
  history: DEFAULT_HISTORY_CONTENT,
  transparency: DEFAULT_TRANSPARENCY_CONTENT,
  schoolCalendars: DEFAULT_SCHOOL_CALENDARS,
  orgCharts: DEFAULT_ORGANIZATIONAL_CHARTS,
  loading: defaultLoadingState,
  loaded: defaultLoadedState,
  feedback: null,

  clearFeedback: () => set({ feedback: null }),

  fetchContactUs: async (force = false) => {
    const { contactUs, loaded } = get();
    if (!force && loaded.contactUs) {
      return contactUs;
    }

    set((state) => ({
      loading: { ...state.loading, contactUs: true },
      feedback: null,
    }));

    try {
      const data = {
        ...DEFAULT_CONTACT_US_CONTENT,
        ...(await pagesApi.getContactUs()),
      };

      set((state) => ({
        contactUs: data,
        loading: { ...state.loading, contactUs: false },
        loaded: { ...state.loaded, contactUs: true },
      }));

      return data;
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, contactUs: false },
        feedback: {
          type: "error",
          section: "contactUs",
          message: getErrorMessage(
            error,
            "Failed to load Contact Us content.",
          ),
        },
      }));
      throw error;
    }
  },

  updateContactUs: async (data) => {
    try {
      const updated = {
        ...DEFAULT_CONTACT_US_CONTENT,
        ...(await pagesApi.updateContactUs(data)),
      };

      set({
        contactUs: updated,
        loaded: { ...get().loaded, contactUs: true },
        feedback: {
          type: "success",
          section: "contactUs",
          message: "Contact Us updated successfully.",
        },
      });

      return updated;
    } catch (error) {
      set({
        feedback: {
          type: "error",
          section: "contactUs",
          message: getErrorMessage(
            error,
            "Failed to update Contact Us.",
          ),
        },
      });
      throw error;
    }
  },

  fetchHistory: async (force = false) => {
    const { history, loaded } = get();
    if (!force && loaded.history) {
      return history;
    }

    set((state) => ({
      loading: { ...state.loading, history: true },
      feedback: null,
    }));

    try {
      const data = {
        ...DEFAULT_HISTORY_CONTENT,
        ...(await pagesApi.getHistory()),
      };

      set((state) => ({
        history: data,
        loading: { ...state.loading, history: false },
        loaded: { ...state.loaded, history: true },
      }));

      return data;
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, history: false },
        feedback: {
          type: "error",
          section: "history",
          message: getErrorMessage(error, "Failed to load History content."),
        },
      }));
      throw error;
    }
  },

  updateHistory: async (data, asset) => {
    try {
      const updated = {
        ...DEFAULT_HISTORY_CONTENT,
        ...(await pagesApi.updateHistory(data, asset)),
      };

      set({
        history: updated,
        loaded: { ...get().loaded, history: true },
        feedback: {
          type: "success",
          section: "history",
          message: "History updated successfully.",
        },
      });

      return updated;
    } catch (error) {
      set({
        feedback: {
          type: "error",
          section: "history",
          message: getErrorMessage(error, "Failed to update History."),
        },
      });
      throw error;
    }
  },

  fetchTransparency: async (force = false) => {
    const { transparency, loaded } = get();
    if (!force && loaded.transparency) {
      return transparency;
    }

    set((state) => ({
      loading: { ...state.loading, transparency: true },
      feedback: null,
    }));

    try {
      const data = {
        ...DEFAULT_TRANSPARENCY_CONTENT,
        ...(await pagesApi.getTransparency()),
      };

      set((state) => ({
        transparency: data,
        loading: { ...state.loading, transparency: false },
        loaded: { ...state.loaded, transparency: true },
      }));

      return data;
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, transparency: false },
        feedback: {
          type: "error",
          section: "transparency",
          message: getErrorMessage(
            error,
            "Failed to load Transparency content.",
          ),
        },
      }));
      throw error;
    }
  },

  updateTransparency: async (asset) => {
    try {
      const updated = {
        ...DEFAULT_TRANSPARENCY_CONTENT,
        ...(await pagesApi.updateTransparency(asset)),
      };

      set({
        transparency: updated,
        loaded: { ...get().loaded, transparency: true },
        feedback: {
          type: "success",
          section: "transparency",
          message: "Transparency updated successfully.",
        },
      });

      return updated;
    } catch (error) {
      set({
        feedback: {
          type: "error",
          section: "transparency",
          message: getErrorMessage(
            error,
            "Failed to update Transparency.",
          ),
        },
      });
      throw error;
    }
  },

  fetchSchoolCalendars: async (force = false) => {
    const { schoolCalendars, loaded } = get();
    if (!force && loaded.schoolCalendars) {
      return schoolCalendars;
    }

    set((state) => ({
      loading: { ...state.loading, schoolCalendars: true },
      feedback: null,
    }));

    try {
      const data = await pagesApi.getSchoolCalendars();

      set((state) => ({
        schoolCalendars: data,
        loading: { ...state.loading, schoolCalendars: false },
        loaded: { ...state.loaded, schoolCalendars: true },
      }));

      return data;
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, schoolCalendars: false },
        feedback: {
          type: "error",
          section: "schoolCalendars",
          message: getErrorMessage(
            error,
            "Failed to load School Calendar content.",
          ),
        },
      }));
      throw error;
    }
  },

  updateSchoolCalendar: async (data, asset) => {
    try {
      const updated = await pagesApi.updateSchoolCalendar(data, asset);
      const calendars = await pagesApi.getSchoolCalendars();

      set({
        schoolCalendars: calendars,
        loaded: { ...get().loaded, schoolCalendars: true },
        feedback: {
          type: "success",
          section: "schoolCalendars",
          message: `School Calendar ${updated.year} saved successfully.`,
        },
      });

      return updated;
    } catch (error) {
      set({
        feedback: {
          type: "error",
          section: "schoolCalendars",
          message: getErrorMessage(
            error,
            "Failed to update School Calendar.",
          ),
        },
      });
      throw error;
    }
  },

  fetchOrgCharts: async (force = false) => {
    const { orgCharts, loaded } = get();
    if (!force && loaded.orgCharts) {
      return orgCharts;
    }

    set((state) => ({
      loading: { ...state.loading, orgCharts: true },
      feedback: null,
    }));

    try {
      const data = await pagesApi.getOrgCharts();

      set((state) => ({
        orgCharts: data,
        loading: { ...state.loading, orgCharts: false },
        loaded: { ...state.loaded, orgCharts: true },
      }));

      return data;
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, orgCharts: false },
        feedback: {
          type: "error",
          section: "orgCharts",
          message: getErrorMessage(
            error,
            "Failed to load Organizational Chart content.",
          ),
        },
      }));
      throw error;
    }
  },

  updateOrgChart: async (data, asset, originalYear) => {
    try {
      const updated = await pagesApi.updateOrgChart(data, asset, originalYear);
      const charts = await pagesApi.getOrgCharts();

      set({
        orgCharts: charts,
        loaded: { ...get().loaded, orgCharts: true },
        feedback: {
          type: "success",
          section: "orgCharts",
          message: `Organizational Chart ${updated.year} saved successfully.`,
        },
      });

      return updated;
    } catch (error) {
      set({
        feedback: {
          type: "error",
          section: "orgCharts",
          message: getErrorMessage(
            error,
            "Failed to update Organizational Chart.",
          ),
        },
      });
      throw error;
    }
  },
}));
