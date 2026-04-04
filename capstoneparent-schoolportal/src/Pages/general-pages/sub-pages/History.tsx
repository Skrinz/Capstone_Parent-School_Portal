import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { Loader } from "@/components/ui/Loader";
import { getAuthUser } from "@/lib/auth";
import { type HistoryContent } from "@/lib/historyContent";
import { pagesApi } from "@/lib/api/pagesApi";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const HistoryImage = () => (
  <img
    src="/History_Pic.jpg"
    alt="Pagsabungan Elementary School"
    className="w-full h-80 object-cover mb-8"
  />
);

export const History = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === "admin" || user?.role === "principal";
  const [content, setContent] = useState<HistoryContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    pagesApi
      .getHistory()
      .then(setContent)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <RoleAwareNavbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        {isLoading ? (
          <Loader />
        ) : !content ? (
          <p>No history content available.</p>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h1 className="text-3xl font-bold text-center">{content.title || "History"}</h1>
              {isAdmin && (
                <Link
                  to="/edithistory"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--button-green) text-white shadow-md transition-transform hover:scale-105"
                  aria-label="Edit History"
                >
                  <Pencil className="h-6 w-6" />
                </Link>
              )}
            </div>

            <HistoryImage />

            <div className="text-justify space-y-4 text-sm leading-relaxed">
              {content.body
                ? content.body
                    .split(/\n\s*\n/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
                : "No history content available."}
            </div>
          </>
        )}
      </div>
    </div>
  );
};