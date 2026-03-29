import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AnnouncementData {
  title: string;
  content: string;
  category: "general" | "staffs" | "memorandum";
}

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AnnouncementData) => void;
  defaultCategory?: AnnouncementData["category"];
}

export const CreateAnnouncementModal = ({
  isOpen,
  onClose,
  onCreate,
  defaultCategory = "general",
}: CreateAnnouncementModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] =
    useState<AnnouncementData["category"]>("general");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory);
      setError(null);
    } else {
      setTitle("");
      setContent("");
      setCategory("general");
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, defaultCategory]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);
    try {
      const data: AnnouncementData = {
        title: title.trim(),
        content: content.trim(),
        category,
      };
      // Caller handles API/save; provide data back
      await Promise.resolve();
      onCreate(data);
      onClose();
    } catch (err) {
      setError("Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Announcement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter announcement title"
            aria-label="Announcement title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCategory("general")}
              className={`px-3 py-2 rounded-md border ${category === "general" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setCategory("staffs")}
              className={`px-3 py-2 rounded-md border ${category === "staffs" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              Staffs
            </button>
            <button
              type="button"
              onClick={() => setCategory("memorandum")}
              className={`px-3 py-2 rounded-md border ${category === "memorandum" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              Memorandum
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the announcement details..."
            className="w-full min-h-[120px] rounded-md border px-3 py-2 text-base focus-visible:border-ring focus-visible:ring-ring/50"
            aria-label="Announcement content"
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="default"
            onClick={onClose}
            type="button"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAnnouncementModal;
