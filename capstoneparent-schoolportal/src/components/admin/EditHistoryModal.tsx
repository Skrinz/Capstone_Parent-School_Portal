import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormInputError } from "@/components/ui/FormInputError";
import type { HistoryContent } from "@/lib/historyContent";
import { useEffect, useState } from "react";

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: HistoryContent;
  onSave: (content: HistoryContent) => void | Promise<void>;
  errors?: Record<string, string>;
}

export const EditHistoryModal = ({
  isOpen,
  onClose,
  initialContent,
  onSave,
  errors = {},
}: EditHistoryModalProps) => {
  const [title, setTitle] = useState(initialContent.title);
  const [body, setBody] = useState(initialContent.body);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(initialContent.title);
    setBody(initialContent.body);
  }, [initialContent]);

  const hasChanges =
    title.trim() !== initialContent.title.trim() ||
    body.trim() !== initialContent.body.trim();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave({
        title,
        body,
        imageUrl: initialContent.imageUrl,
        imageFileName: initialContent.imageFileName,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit History"
      contentClassName="max-w-4xl"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="history-title" className="mb-2 block text-lg font-semibold">
            Title
          </label>
          <input
            id="history-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSaving}
            className={`w-full rounded-md border-2 px-4 py-3 text-lg focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
              errors.title
                ? "border-red-500 focus:ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                : "border-black focus:ring-(--button-green)"
            }`}
          />
          <FormInputError message={errors.title} />
        </div>

        <div>
          <label htmlFor="history-body" className="mb-2 block text-lg font-semibold">
            History Content
          </label>
          <textarea
            id="history-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={10}
            disabled={isSaving}
            className={`w-full rounded-md border-2 px-4 py-3 text-lg leading-relaxed focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
              errors.body
                ? "border-red-500 focus:ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                : "border-black focus:ring-(--button-green)"
            }`}
          />
          <FormInputError message={errors.body} />
          <p className="mt-1 text-xs text-gray-600">
            Use a blank line to create a new paragraph.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400 inline-flex items-center gap-2"
          >
            {isSaving && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
