import { create } from "zustand";

type ApiFeedback = {
  type: "success" | "error";
  message: string;
};

interface ApiFeedbackStore {
  feedback: ApiFeedback | null;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  clearFeedback: () => void;
}

export const useApiFeedbackStore = create<ApiFeedbackStore>((set) => ({
  feedback: null,
  showSuccess: (message) =>
    set({
      feedback: {
        type: "success",
        message,
      },
    }),
  showError: (message) =>
    set({
      feedback: {
        type: "error",
        message,
      },
    }),
  clearFeedback: () => set({ feedback: null }),
}));

export const useApiFeedback = useApiFeedbackStore;
