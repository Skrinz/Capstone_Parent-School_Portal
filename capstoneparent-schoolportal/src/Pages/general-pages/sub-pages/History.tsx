import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { getAuthUser } from "@/lib/auth";
import { useAboutUsStore } from "@/lib/store/aboutUsStore";
import { Pencil, Plus } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const HistoryImage = () => (
  <img
    src="/History_Pic.jpg"
    alt="Pagsabungan Elementary School"
    className="w-full h-80 object-cover mb-8"
  />
);

const HistorySkeleton = ({ showEdit }: { showEdit: boolean }) => (
  <>
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="h-10 w-56 animate-pulse rounded bg-gray-200" />
      {showEdit && <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />}
    </div>
    <div className="mb-8 h-80 w-full animate-pulse rounded bg-gray-200" />
    <div className="space-y-4">
      <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-[97%] animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-[94%] animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-[92%] animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-[89%] animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-[85%] animate-pulse rounded bg-gray-200" />
    </div>
  </>
);

export const History = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === "admin";
  const content = useAboutUsStore((state) => state.history);
  const isLoading = useAboutUsStore((state) => state.loading.history);
  const fetchHistory = useAboutUsStore((state) => state.fetchHistory);

  useEffect(() => {
    fetchHistory().catch(() => undefined);
  }, [fetchHistory]);

  const hasContent = Boolean(content.title || content.body || content.imageUrl);

  return (
    <div>
      <RoleAwareNavbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        {isLoading ? (
          <HistorySkeleton showEdit={isAdmin} />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h1 className="text-3xl font-bold text-center">
                {content.title || (hasContent ? "History" : "No history content available.")}
              </h1>
            {isAdmin && (
              <Link
                to="/edithistory"
                className="fixed bottom-8 right-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-(--button-green) text-white shadow-lg transition-transform hover:scale-105"
                aria-label={hasContent ? "Edit History" : "Add History"}
              >
                {hasContent ? (
                  <Pencil className="h-10 w-10" />
                ) : (
                  <Plus className="h-10 w-10" />
                )}
              </Link>
            )}
            </div>

            {hasContent ? (
              <>
                <HistoryImage />
                <div className="space-y-5 text-justify text-base leading-8 md:text-lg">
                  {content.body
                    ? content.body
                        .split(/\n\s*\n/)
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
                    : "No history content available."}
                </div>
              </>
            ) : (
              !isAdmin && <p>No history content available.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
