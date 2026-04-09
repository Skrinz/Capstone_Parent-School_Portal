import { create } from "zustand";
import type { AnnouncementPostItem } from "@/components/staff/AnnouncementPostFeed";
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "@/lib/api/announcementsApi";
import type { AnnouncementCategory } from "@/lib/announcementPosts";

type StoreFeedback = {
  type: "success" | "error";
  message: string;
} | null;

type CreateAnnouncementInput = {
  title: string;
  content: string;
  category: AnnouncementCategory;
  files?: Array<{ id: string; name: string; file: File }>;
};

type UpdateAnnouncementInput = {
  announcementId: number;
  title: string;
  content: string;
  category: AnnouncementCategory;
  files?: Array<{ id: string; name: string; file: File }>;
  replaceAttachments?: boolean;
  removeFileIds?: number[];
};

const EMPTY_POSTS: Record<AnnouncementCategory, AnnouncementPostItem[]> = {
  general: [],
  staffs: [],
  memorandum: [],
};

const EMPTY_LOADING: Record<AnnouncementCategory, boolean> = {
  general: false,
  staffs: false,
  memorandum: false,
};

const EMPTY_LOADED: Record<AnnouncementCategory, boolean> = {
  general: false,
  staffs: false,
  memorandum: false,
};

const getBackendType = (
  category: AnnouncementCategory,
): "General" | "Staff_only" | "Memorandum" => {
  switch (category) {
    case "general":
      return "General";
    case "staffs":
      return "Staff_only";
    case "memorandum":
      return "Memorandum";
    default:
      return "General";
  }
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

interface AnnouncementStore {
  viewCategory: AnnouncementCategory;
  postsByCategory: Record<AnnouncementCategory, AnnouncementPostItem[]>;
  loadingByCategory: Record<AnnouncementCategory, boolean>;
  loadedByCategory: Record<AnnouncementCategory, boolean>;
  feedback: StoreFeedback;
  setViewCategory: (category: AnnouncementCategory) => void;
  clearFeedback: () => void;
  fetchPosts: (category: AnnouncementCategory, force?: boolean) => Promise<void>;
  createPost: (data: CreateAnnouncementInput) => Promise<void>;
  updatePost: (data: UpdateAnnouncementInput) => Promise<void>;
}

export const useAnnouncementStore = create<AnnouncementStore>((set, get) => ({
  viewCategory: "general",
  postsByCategory: EMPTY_POSTS,
  loadingByCategory: EMPTY_LOADING,
  loadedByCategory: EMPTY_LOADED,
  feedback: null,

  setViewCategory: (category) => set({ viewCategory: category }),
  clearFeedback: () => set({ feedback: null }),

  fetchPosts: async (category, force = false) => {
    const isLoading = get().loadingByCategory[category];
    const isLoaded = get().loadedByCategory[category];

    if (isLoading || (!force && isLoaded)) {
      return;
    }

    set((state) => ({
      loadingByCategory: {
        ...state.loadingByCategory,
        [category]: true,
      },
      feedback: null,
    }));

    try {
      const response = await getAnnouncements({
        limit: 50,
        type: getBackendType(category),
      });

      set((state) => ({
        postsByCategory: {
          ...state.postsByCategory,
          [category]: response.data || [],
        },
        loadingByCategory: {
          ...state.loadingByCategory,
          [category]: false,
        },
        loadedByCategory: {
          ...state.loadedByCategory,
          [category]: true,
        },
      }));
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to load announcements.",
      );

      set((state) => ({
        loadingByCategory: {
          ...state.loadingByCategory,
          [category]: false,
        },
        feedback: {
          type: "error",
          message,
        },
      }));

      throw error;
    }
  },

  createPost: async (data) => {
    try {
      await createAnnouncement({
        announcement_title: data.title,
        announcement_desc: data.content,
        announcement_type: getBackendType(data.category),
        attachments: (data.files || []).map((file) => file.file),
      });

      await get().fetchPosts(data.category, true);

      set({
        feedback: {
          type: "success",
          message: "Announcement posted successfully.",
        },
      });
    } catch (error) {
      set({
        feedback: {
          type: "error",
          message: getErrorMessage(
            error,
            "Failed to create announcement.",
          ),
        },
      });
      throw error;
    }
  },

  updatePost: async (data) => {
    const existingCategory = Object.entries(get().postsByCategory).find(([, posts]) =>
      posts.some((post) => post.announcement_id === data.announcementId),
    )?.[0] as AnnouncementCategory | undefined;

    try {
      await updateAnnouncement(data.announcementId, {
        announcement_title: data.title,
        announcement_desc: data.content,
        announcement_type: getBackendType(data.category),
        replace_attachments: data.replaceAttachments,
        remove_file_ids: data.removeFileIds,
        ...(data.files?.length
          ? { attachments: data.files.map((file) => file.file) }
          : {}),
      });

      await get().fetchPosts(data.category, true);
      if (existingCategory && existingCategory !== data.category) {
        await get().fetchPosts(existingCategory, true);
      }

      set({
        feedback: {
          type: "success",
          message: "Announcement updated successfully.",
        },
      });
    } catch (error) {
      set({
        feedback: {
          type: "error",
          message: getErrorMessage(
            error,
            "Failed to update announcement.",
          ),
        },
      });
      throw error;
    }
  },
}));
