import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { HistoryContent } from "@/lib/historyContent";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: HistoryContent;
  onSave: (content: HistoryContent) => void;
}

function getReadableFileName(content: HistoryContent): string {
  if (content.imageFileName) {
    return content.imageFileName;
  }

  if (content.imageUrl.startsWith("data:")) {
    return "history-image.png";
  }

  const filePart = content.imageUrl.split("/").pop();
  return filePart || "history-image.png";
}

export const EditHistoryModal = ({
  isOpen,
  onClose,
  initialContent,
  onSave,
}: EditHistoryModalProps) => {
  const [title, setTitle] = useState(initialContent.title);
  const [body, setBody] = useState(initialContent.body);
  const [previewImageUrl, setPreviewImageUrl] = useState(initialContent.imageUrl);
  const [imageFileName, setImageFileName] = useState(
    getReadableFileName(initialContent),
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(initialContent.title);
    setBody(initialContent.body);
    setPreviewImageUrl(initialContent.imageUrl);
    setImageFileName(getReadableFileName(initialContent));
  }, [initialContent]);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setPreviewImageUrl(result);
        setImageFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({
      title,
      body,
      imageUrl: previewImageUrl || initialContent.imageUrl,
      imageFileName,
    });
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
            className="w-full rounded-md border-2 border-black px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-(--button-green)"
          />
        </div>

        <div className="space-y-1 text-center">
          <p className="text-lg font-semibold">Current Image</p>
          <p className="text-sm text-gray-700">{imageFileName}</p>
        </div>

        <div className="mx-auto max-h-[30vh] overflow-hidden rounded-md border-2 border-black/20 bg-white">
          <img
            src={previewImageUrl}
            alt="History image preview"
            className="max-h-[30vh] w-full object-contain"
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handleUploadClick}
            className="h-auto rounded-md bg-(--navbar-bg) px-8 py-3 text-lg font-medium text-black hover:bg-yellow-300"
          >
            Upload New History Picture
            <Plus className="ml-2 h-6 w-6 text-black" strokeWidth={3} />
          </Button>
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
            className="w-full rounded-md border-2 border-black px-4 py-3 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-(--button-green)"
          />
          <p className="mt-1 text-xs text-gray-600">
            Use a blank line to create a new paragraph.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};