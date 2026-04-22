import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormInputErrorProps {
  message?: string;
  className?: string;
}

export const FormInputError = ({ message, className }: FormInputErrorProps) => {
  if (!message) return null;

  return (
    <div 
      className={cn(
        "mt-1.5 flex items-start gap-2 text-red-600 animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="text-sm font-medium leading-tight">
        {message}
      </span>
    </div>
  );
};
