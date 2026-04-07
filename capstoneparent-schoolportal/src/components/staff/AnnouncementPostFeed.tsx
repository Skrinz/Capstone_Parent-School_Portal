import { useEffect, useState } from "react";
import { FileText, Pencil, Plus } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api/base";

export type AnnouncementAttachment = string | { name: string; url: string };

const FALLBACK_PDF_PREVIEW_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
const ABSOLUTE_OR_BROWSER_URL_PATTERN = /^(https?:\/\/|blob:|data:|\/)/i;

const getAttachmentLabelFromUrl = (url: string) => {
  const cleanUrl = url.split("#")[0].split("?")[0];
  const segment = cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);

  if (!segment) {
    return "Attachment.pdf";
  }

  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const resolveAttachmentLink = (attachment: AnnouncementAttachment) => {
  if (typeof attachment === "string") {
    if (ABSOLUTE_OR_BROWSER_URL_PATTERN.test(attachment)) {
      return {
        label: getAttachmentLabelFromUrl(attachment),
        href: attachment,
      };
    }

    return {
      label: attachment,
      href: `${FALLBACK_PDF_PREVIEW_URL}#name=${encodeURIComponent(attachment)}`,
    };
  }

  return {
    label: attachment.name,
    href: ABSOLUTE_OR_BROWSER_URL_PATTERN.test(attachment.url)
      ? attachment.url
      : `${FALLBACK_PDF_PREVIEW_URL}#name=${encodeURIComponent(attachment.name)}`,
  };
};

export interface AnnouncementPostItem {
  announcement_id: number;
  announcement_title: string;
  announcement_desc: string;
  announcement_type: "General" | "Staff_only" | "Memorandum";
  created_at: string;
  user?: {
    user_id: number;
    fname: string;
    lname: string;
    photo_path?: string;
    roles?: Array<{
      role: string;
    }>;
  };
  files?: Array<{
    file: {
      file_id?: number;
      file_name: string;
      file_path: string;
    }
  }>;
}

interface AnnouncementPostFeedProps {
  posts: AnnouncementPostItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  onAdd?: () => void;
  onEdit?: (post: AnnouncementPostItem) => void;
  /** If set with onEdit, edit is shown only when this returns true (e.g. author or admin). */
  canEditPost?: (post: AnnouncementPostItem) => boolean;
}

const authorAvatarClassName =
  "mt-4 h-14 w-14 shrink-0 rounded-full border-2 border-gray-300 bg-white object-cover sm:h-16 sm:w-16";

const getAuthorInitials = (user: NonNullable<AnnouncementPostItem["user"]>) => {
  const a = user.fname?.trim()?.[0] ?? "";
  const b = user.lname?.trim()?.[0] ?? "";
  const raw = `${a}${b}`.toUpperCase();
  return raw || "?";
};

const AnnouncementAuthorAvatar = ({ post }: { post: AnnouncementPostItem }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const user = post.user;

  useEffect(() => {
    setImgFailed(false);
  }, [post.announcement_id, user?.user_id, user?.photo_path]);

  if (!user) {
    return (
      <div
        className={`${authorAvatarClassName} flex items-center justify-center bg-gray-100 text-sm font-semibold uppercase text-gray-700 sm:text-base`}
        aria-label="Author avatar"
      >
        ?
      </div>
    );
  }

  const rawPath = user.photo_path?.trim();
  const photoUrl = rawPath ? resolveMediaUrl(rawPath) : null;

  if (!photoUrl || imgFailed) {
    return (
      <div
        className={`${authorAvatarClassName} flex items-center justify-center bg-gray-100 text-sm font-semibold uppercase text-gray-700 sm:text-base`}
        aria-label="Author avatar"
      >
        {getAuthorInitials(user)}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt=""
      className={authorAvatarClassName}
      onError={() => setImgFailed(true)}
    />
  );
};

const AnnouncementFeedSkeleton = () => (
  <section className="mx-auto w-full max-w-330 px-3 py-6 text-left sm:px-5 lg:px-6">
    <div className="space-y-5 sm:space-y-6">
      {Array.from({ length: 3 }, (_, index) => (
        <article
          key={index}
          className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 sm:grid-cols-[68px_minmax(0,1fr)] sm:gap-5"
        >
          <div className="mt-4 h-14 w-14 animate-pulse rounded-full border-2 border-gray-200 bg-gray-200 sm:h-16 sm:w-16" />
          <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm sm:p-7 lg:p-8">
            <div className="h-7 w-40 animate-pulse rounded bg-gray-200 sm:h-8" />
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="mt-5 h-10 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-[96%] animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-[88%] animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-[72%] animate-pulse rounded bg-gray-200" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="h-11 w-40 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-11 w-36 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export const AnnouncementPostFeed = ({
  posts,
  isLoading,
  emptyMessage = "No announcements available in this category yet.",
  onAdd,
  onEdit,
  canEditPost,
}: AnnouncementPostFeedProps) => {
  const ROLE_ORDER = [
    "admin",
    "principal",
    "vice_principal",
    "teacher",
    "librarian",
  ] as const;

  const ROLE_LABELS: Record<(typeof ROLE_ORDER)[number], string> = {
    admin: "Admin",
    principal: "Principal",
    vice_principal: "Vice Principal",
    teacher: "Teacher",
    librarian: "librarian",
  };

  const getPrimaryRoleLabel = (roles?: Array<{ role: string }>) => {
    if (!roles || roles.length === 0) return null;
    const roleSet = new Set(roles.map((r) => r.role.toLowerCase()));
    const primary = ROLE_ORDER.find((r) => roleSet.has(r));
    return primary ? ROLE_LABELS[primary] : null;
  };

  if (isLoading) {
    return <AnnouncementFeedSkeleton />;
  }

  return (
    <section className="mx-auto w-full max-w-330 px-3 py-6 text-left sm:px-5 lg:px-6">
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-base text-gray-600 sm:text-lg">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
        {posts.map((post) => {
          const mayEditPost =
            onEdit != null &&
            (canEditPost == null || canEditPost(post));

          return (
          <article
            key={post.announcement_id}
            className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 sm:grid-cols-[68px_minmax(0,1fr)] sm:gap-5"
          >
            <AnnouncementAuthorAvatar post={post} />

            <div className="relative w-full overflow-hidden rounded-2xl border border-gray-300 bg-linear-to-r from-gray-100 to-gray-200 p-5 shadow-sm sm:p-7 lg:p-8">
              {mayEditPost && (
                <button
                  type="button"
                  aria-label="Edit announcement"
                  onClick={() => onEdit(post)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-(--button-green) text-white shadow-md transition-colors hover:bg-(--button-hover-green) sm:right-6 sm:top-6 sm:h-11 sm:w-11"
                >
                  <Pencil size={20} />
                </button>
              )}

              <div className={mayEditPost ? "pr-0 sm:pr-14" : ""}>
                <p className="text-xl font-semibold uppercase tracking-wide text-blue-600 sm:text-2xl">
                  {post.user ? `${post.user.fname} ${post.user.lname}` : "Admin"}
                </p>
                {post.user && getPrimaryRoleLabel(post.user.roles) && (
                  <p className="mt-1 text-xs font-semibold tracking-wide text-gray-600 sm:text-sm">
                    {getPrimaryRoleLabel(post.user.roles)}
                  </p>
                )}
                <p className="text-sm text-gray-600 sm:text-base">
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <h2 className="mt-4 text-[clamp(1.65rem,3.4vw,3rem)] font-bold leading-tight text-gray-950">
                  {post.announcement_title}
                </h2>

                <p className="mt-4 whitespace-pre-line text-[clamp(1rem,1.45vw,1.4rem)] leading-relaxed text-gray-900">
                  {post.announcement_desc}
                </p>

                {!!post.files?.length && (
                  <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
                    {post.files.map(({ file }) => {
                      const attachment = { name: file.file_name, url: file.file_path };
                      const resolvedAttachment = resolveAttachmentLink(attachment);
                      const attachmentKey = `${attachment.name}-${attachment.url}`;

                      return (
                        <a
                          key={attachmentKey}
                          href={resolvedAttachment.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-transparent bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-(--button-green) hover:text-(--button-green) sm:px-4 sm:py-3 sm:text-base"
                          title={`Open ${resolvedAttachment.label}`}
                        >
                          <FileText className="text-red-500" size={18} />
                          <span className="max-w-44 truncate sm:max-w-52">
                            {resolvedAttachment.label}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </article>
          );
        })}
        </div>
      )}

      {onAdd && (
        <button
          type="button"
          aria-label="Create announcement"
          onClick={onAdd}
          className="fixed bottom-8 right-8 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-(--button-green) text-white shadow-lg transition-colors hover:bg-(--button-hover-green)"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}
    </section>
  );
};
