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
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${palette} ${className}`.trim()}
    >
      {message}
    </div>
  );
};
