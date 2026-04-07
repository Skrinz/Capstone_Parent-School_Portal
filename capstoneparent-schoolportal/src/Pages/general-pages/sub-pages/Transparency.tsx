import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { EditTransparencyModal } from "@/components/admin/EditTransparencyModal";
import { getAuthUser } from "@/lib/auth";
import { type TransparencyContent } from "@/lib/transparencyContent";
import { pagesApi } from "@/lib/api/pagesApi";
import { resolveMediaUrl } from "@/lib/api/base";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";

const TransparencyPreview = ({ imageUrl }: { imageUrl: string }) => {
  const [hasImageError, setHasImageError] = useState(false);

  if (hasImageError || !imageUrl) {
    return (
      <div className="flex min-h-130 w-full items-center justify-center rounded-sm bg-white p-8 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-700">Transparency file not found</p>
          <p className="mt-2 text-lg text-gray-600">
            Add the transparency image by uploading a new one from edit page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolveMediaUrl(imageUrl)}
      alt="Transparency and monthly budget proposal"
      onError={() => setHasImageError(true)}
      className="h-auto w-full rounded-sm bg-white object-contain"
    />
  );
};

const TransparencySkeleton = ({ showEdit }: { showEdit: boolean }) => (
  <>
    <div className="mb-8 h-10 w-96 max-w-full animate-pulse rounded bg-gray-200" />
    <div className="w-full rounded-sm bg-gray-300 p-6">
      <div className="h-[34rem] w-full animate-pulse rounded bg-gray-200" />
    </div>
    {showEdit && (
      <div className="fixed bottom-8 right-8 h-20 w-20 animate-pulse rounded-full bg-gray-200 shadow-lg" />
    )}
  </>
);

export const Transparency = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === "admin" || user?.role === "principal";
  const [content, setContent] = useState<TransparencyContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    pagesApi
      .getTransparency()
      .then(setContent)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (updatedContent: TransparencyContent, file?: File) => {
    try {
      await pagesApi.updateTransparency(file);
      const fresh = await pagesApi.getTransparency();
      setContent(fresh);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save transparency", error);
    }
  };

  return (
    <div>
      <RoleAwareNavbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        {isLoading ? (
          <TransparencySkeleton showEdit={isAdmin} />
        ) : !content ? (
          <p>No transparency data available.</p>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-8">Transparency & Monthly Budget Proposal</h1>
            <div className="w-full rounded-sm bg-gray-300 p-6">
              <TransparencyPreview imageUrl={content.imageUrl} />
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-(--button-green) text-white shadow-lg transition-transform hover:scale-105"
                aria-label="Edit Transparency"
              >
                <Pencil className="h-10 w-10" />
              </button>
            )}
          </>
        )}
      </div>

      {isAdmin && content && (
        <EditTransparencyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialContent={content}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
