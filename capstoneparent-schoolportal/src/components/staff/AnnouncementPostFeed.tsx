import { FileText, Pencil, Plus } from "lucide-react";

export interface AnnouncementPostItem {
  id: string;
  author: string;
  role: string;
  date: string;
  title: string;
  content: string;
  attachments?: string[];
}

interface AnnouncementPostFeedProps {
  posts: AnnouncementPostItem[];
  onAdd?: () => void;
  onEdit?: (post: AnnouncementPostItem) => void;
}

export const AnnouncementPostFeed = ({
  posts,
  onAdd,
  onEdit,
}: AnnouncementPostFeedProps) => {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 text-left">
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="relative pl-20">
            <img
              src="/Logo.png"
              alt="Author avatar"
              className="absolute left-0 top-8 h-14 w-14 rounded-full border-2 border-gray-300 bg-white object-cover"
            />

            <div className="relative overflow-hidden rounded-2xl border border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 p-8 shadow-sm">
              <button
                type="button"
                aria-label="Edit announcement"
                onClick={() => onEdit?.(post)}
                className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-(--button-green) text-white shadow-md transition-colors hover:bg-(--button-hover-green)"
              >
                <Pencil size={22} />
              </button>

              <div className="pr-16">
                <p className="text-4xl font-semibold uppercase tracking-wide text-blue-600">
                  {post.author}
                </p>
                <p className="text-3xl font-semibold text-gray-900">{post.role}</p>
                <p className="text-2xl text-gray-600">{post.date}</p>

                <h2 className="mt-6 text-5xl font-bold text-gray-950">{post.title}</h2>

                <p className="mt-5 whitespace-pre-line text-3xl leading-relaxed text-gray-900">
                  {post.content}
                </p>

                {!!post.attachments?.length && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {post.attachments.map((attachment) => (
                      <div
                        key={attachment}
                        className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-lg font-medium text-gray-700 shadow-sm"
                      >
                        <FileText className="text-red-500" size={20} />
                        <span className="max-w-44 truncate">{attachment}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        aria-label="Create announcement"
        onClick={onAdd}
        className="fixed bottom-8 right-8 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-(--button-green) text-white shadow-lg transition-colors hover:bg-(--button-hover-green)"
      >
        <Plus size={32} strokeWidth={3} />
      </button>
    </section>
  );
};
