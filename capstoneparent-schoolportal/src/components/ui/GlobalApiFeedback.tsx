import { useEffect } from "react";
import { StatusMessage } from "./StatusMessage";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

const AUTO_HIDE_DELAY_MS = 4500;

export const GlobalApiFeedback = () => {
  const feedback = useApiFeedbackStore((state) => state.feedback);
  const clearFeedback = useApiFeedbackStore((state) => state.clearFeedback);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      clearFeedback();
    }, AUTO_HIDE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [clearFeedback, feedback]);

  if (!feedback) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-8 top-8 z-[100] flex justify-end px-4">
      <StatusMessage
        type={feedback.type}
        message={feedback.message}
        className="pointer-events-auto w-full max-w-lg shadow-xl"
      />
    </div>
  );
};
