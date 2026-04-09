import { useCallback, useEffect, useState } from "react";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import {
  AnnouncementPostFeed,
  type AnnouncementPostItem,
} from "@/components/staff/AnnouncementPostFeed";
import { CreateAnnouncementModal } from "@/components/staff/CreateAnnouncementModal";
import { EditAnnouncementModal } from "@/components/staff/EditAnnouncementModal";
import { getAuthUser } from "@/lib/auth";
import type { AnnouncementCategory } from "@/lib/announcementPosts";
import type { UserRole } from "@/lib/store/authStore";
import { useAnnouncementStore } from "@/lib/store/announcementStore";

/** School staff (excludes parents). Used for announcement type toggle and create/edit. */
const SCHOOL_STAFF_ROLES: UserRole[] = [
  "admin",
  "vice_principal",
  "principal",
  "teacher",
  "librarian",
  "staff",
];

const VIEW_OPTIONS: { id: AnnouncementCategory; label: string }[] = [
  { id: "general", label: "GENERAL" },
  { id: "staffs", label: "STAFFS" },
  { id: "memorandum", label: "MEMORANDUM" },
];
const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  general: "General",
  staffs: "Staffs",
  memorandum: "Memorandum",
};

export const Announcements = () => {
  const authUser = getAuthUser();
  const role = authUser?.role ?? null;

  const isSchoolStaff = role !== null && SCHOOL_STAFF_ROLES.includes(role);

  const {
    viewCategory,
    setViewCategory,
    postsByCategory,
    loadingByCategory,
    feedback,
    clearFeedback,
    fetchPosts,
    createPost,
    updatePost,
  } = useAnnouncementStore();

  const effectiveCategory: AnnouncementCategory = isSchoolStaff
    ? viewCategory
    : "general";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<AnnouncementPostItem | null>(
    null,
  );

  useEffect(() => {
    fetchPosts(effectiveCategory).catch(() => undefined);
  }, [effectiveCategory, fetchPosts]);

  const handleCreate = async (data: {
    title: string;
    content: string;
    category: AnnouncementCategory;
    files?: Array<{ id: string; name: string; file: File }>;
  }) => {
    await createPost(data);
  };

  const handleOpenEdit = (post: AnnouncementPostItem) => {
    setSelectedPost(post);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: {
    announcementId: number;
    title: string;
    content: string;
    category: AnnouncementCategory;
    files?: Array<{ id: string; name: string; file: File }>;
    replaceAttachments?: boolean;
    removeFileIds?: number[];
  }) => {
    await updatePost(data);
  };

  const canEditPost = useCallback(
    (post: AnnouncementPostItem) => {
      if (authUser?.role === "admin") return true;
      const authorId = post.user?.user_id;
      if (authorId == null || authUser == null) return false;
      return authorId === authUser.userId;
    },
    [authUser],
  );

  const posts = postsByCategory[effectiveCategory];
  const isLoading = loadingByCategory[effectiveCategory];

  return (
    <div className="min-h-screen bg-white">
      <RoleAwareNavbar />
      <div className="mx-auto w-full max-w-330 px-3 pt-6 sm:px-5 lg:px-6">
        {feedback && (
          <StatusMessage
            type={feedback.type}
            message={feedback.message}
            className="mb-4"
          />
        )}
        {isSchoolStaff && (
          <div
            className="flex flex-wrap items-baseline gap-x-10 gap-y-2 sm:gap-x-14 lg:gap-x-16"
            role="tablist"
            aria-label="Announcement categories"
          >
            {VIEW_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={effectiveCategory === id}
                onClick={() => {
                  clearFeedback();
                  setViewCategory(id);
                }}
                className={`cursor-pointer border-0 bg-transparent p-0 font-sans text-sm uppercase tracking-wide text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 sm:text-base ${
                  effectiveCategory === id ? "font-bold" : "font-normal"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <AnnouncementPostFeed
        posts={posts}
        isLoading={isLoading}
        emptyMessage={`No announcements have been posted for ${CATEGORY_LABELS[effectiveCategory]} yet.`}
        {...(isSchoolStaff
          ? {
              onAdd: () => setIsCreateModalOpen(true),
              onEdit: handleOpenEdit,
              canEditPost,
            }
          : {})}
      />

      {isSchoolStaff && (
        <>
          <CreateAnnouncementModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              clearFeedback();
              setIsCreateModalOpen(false);
            }}
            onCreate={handleCreate}
            defaultCategory={effectiveCategory}
          />
          <EditAnnouncementModal
            isOpen={isEditModalOpen}
            onClose={() => {
              clearFeedback();
              setIsEditModalOpen(false);
              setSelectedPost(null);
            }}
            post={selectedPost}
            onUpdate={handleUpdate}
          />
        </>
      )}
    </div>
  );
};
