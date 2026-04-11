interface StatusMessageProps {
  type: "success" | "error";
  message: string;
  className?: string;
}

export const StatusMessage = ({
  type,
  message,
  className = "",
}: StatusMessageProps) => {
  const palette =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-6 py-3.5 text-base font-semibold shadow-2xl ${palette} ${className}`.trim()}
    >
      {message}
    </div>
  );
};
