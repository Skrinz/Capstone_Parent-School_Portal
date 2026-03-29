import { useCallback, useState } from "react";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import {
  AnnouncementPostFeed,
  type AnnouncementPostItem,
} from "@/components/staff/AnnouncementPostFeed";
import { CreateAnnouncementModal } from "@/components/staff/CreateAnnouncementModal";
import { EditAnnouncementModal } from "@/components/staff/EditAnnouncementModal";
import { getAuthUser } from "@/lib/auth";
import { useAnnouncementPosts } from "@/hooks/useAnnouncementPosts";
import type { AnnouncementCategory } from "@/lib/announcementPosts";
import type { UserRole } from "@/lib/store/authStore";

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

export const Announcements = () => {
  const authUser = getAuthUser();
  const role = authUser?.role ?? null;

  const isSchoolStaff = role !== null && SCHOOL_STAFF_ROLES.includes(role);

  const [viewCategory, setViewCategory] =
    useState<AnnouncementCategory>("general");
  const effectiveCategory: AnnouncementCategory = isSchoolStaff
    ? viewCategory
    : "general";

  const { posts, isLoading, createPost } =
    useAnnouncementPosts(effectiveCategory);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleCreate = (data: {
    title: string;
    content: string;
    category: AnnouncementCategory;
  }) => {
    createPost(data);
  };

  const handleOpenEdit = (_post: AnnouncementPostItem) => {
    setIsEditModalOpen(true);
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

  return (
    <div className="min-h-screen bg-white">
      <RoleAwareNavbar />
      {isSchoolStaff && (
        <div className="mx-auto w-full max-w-330 px-3 pt-6 sm:px-5 lg:px-6">
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
                onClick={() => setViewCategory(id)}
                className={`cursor-pointer border-0 bg-transparent p-0 font-sans text-sm uppercase tracking-wide text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 sm:text-base ${
                  effectiveCategory === id ? "font-bold" : "font-normal"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <AnnouncementPostFeed
        posts={posts}
        isLoading={isLoading}
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
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreate}
            defaultCategory={effectiveCategory}
          />
          <EditAnnouncementModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />
        </>
      )}
    </div>
  );
};
