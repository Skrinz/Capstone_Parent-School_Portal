import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { resolveMediaUrl } from "@/lib/api/base";
import type { OrganizationalChartItem } from "@/lib/organizationalChartContent";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type OrgChartModalMode = "add" | "edit";

interface EditOrganizationalChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: OrgChartModalMode;
  charts: OrganizationalChartItem[];
  /** School year of the chart being edited (edit mode only) */
  editYear?: string;
  /** Actual chart ID if editing a specific record */
  editChartId?: number;
  onSave: (updatedChart: OrganizationalChartItem, file?: File) => void | Promise<void>;
}

function getReadableFileName(chart: OrganizationalChartItem): string {
  if (chart.fileName) {
    return chart.fileName;
  }

  if (!chart.imageUrl) {
    return "No file selected";
  }

  if (chart.imageUrl.startsWith("data:")) {
    return `organizational-chart-${chart.year}.png`;
  }

  const filePart = chart.imageUrl.split("/").pop();
  return filePart || `organizational-chart-${chart.year}.png`;
}

const currentYearString = () => String(new Date().getFullYear());

export const EditOrganizationalChartModal = ({
  isOpen,
  onClose,
  mode,
  charts,
  editYear,
  editChartId,
  onSave,
}: EditOrganizationalChartModalProps) => {
  const [yearInput, setYearInput] = useState(currentYearString());
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [fileName, setFileName] = useState("No file selected");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const chartForEdit = useMemo(() => {
    if (mode !== "edit") {
      return null;
    }
    if (editChartId) {
      return charts.find((c) => c.id === editChartId) ?? null;
    }
    if (editYear) {
      return charts.find((c) => c.year === editYear) ?? null;
    }
    return null;
  }, [mode, editYear, editChartId, charts]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);

    if (mode === "add") {
      setYearInput(currentYearString());
      setPreviewImageUrl("");
      setFileName("No file selected");
      setSelectedFile(null);
      return;
    }

    if (mode === "edit" && editYear) {
      const c =
        charts.find((ch) => ch.year === editYear) ?? ({
          year: editYear,
          imageUrl: "",
          fileName: "",
        } as OrganizationalChartItem);
      setYearInput(c.year);
      setPreviewImageUrl(c.imageUrl ? resolveMediaUrl(c.imageUrl) : "");
      setFileName(getReadableFileName(c));
      setSelectedFile(null);
    }
  }, [isOpen, mode, editYear, charts]);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setPreviewImageUrl(result);
        setFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError(null);
    const base: OrganizationalChartItem = {
      id: chartForEdit?.id,
      year: yearInput,
      imageUrl: previewImageUrl || chartForEdit?.imageUrl || "",
      fileName,
    };

    if (mode === "add" && !selectedFile) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(
        {
          ...base,
          imageUrl: selectedFile ? previewImageUrl : base.imageUrl,
        },
        selectedFile || undefined,
      );
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.error) {
        setError(err.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Failed to save organizational chart. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const title = mode === "add" ? "Add organizational chart" : "Edit organizational chart";
  const hasChanges =
    mode === "edit"
      ? yearInput !== (chartForEdit?.year ?? "") || Boolean(selectedFile)
      : Boolean(selectedFile);
  const canSubmit = isSaving ? false : mode === "edit" ? hasChanges : Boolean(selectedFile);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} contentClassName="max-w-3xl">
      <div className="space-y-6">
        {mode === "add" ? (
          <p className="text-lg text-black/80">
            Choose the school year and upload a chart image. Only image files (JPEG, PNG) are accepted.
          </p>
        ) : (
          <p className="text-lg text-black/80">
            Update the image for this school year, or replace the file below.
          </p>
        )}

        {error && (
          <div className="rounded-md bg-red-100 p-4 border border-red-400">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="org-chart-year" className="text-lg font-semibold">
            School year
          </label>
          <input
            id="org-chart-year"
            type="number"
            value={yearInput}
            onChange={(event) => setYearInput(event.target.value)}
            disabled={isSaving}
            className="w-full rounded-md border-2 border-black bg-white px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-(--button-green) disabled:opacity-50"
            min={1900}
            max={2100}
          />
        </div>

        <div
          className={`mx-auto flex min-h-[200px] max-h-[40vh] w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-black/25 bg-white ${
            previewImageUrl ? "border-solid border-black/20" : ""
          }`}
        >
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt="Organizational chart preview"
              className="max-h-[40vh] w-full object-contain"
            />
          ) : (
            <p className="px-4 text-center text-lg text-black/50">No image selected yet</p>
          )}
        </div>

        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-black/60">File</p>
          <p className="text-lg">{fileName}</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Button
            type="button"
            onClick={handleUploadClick}
            disabled={isSaving}
            className="h-auto rounded-md bg-(--navbar-bg) px-8 py-3 text-lg font-medium text-black hover:bg-yellow-300 disabled:opacity-50"
          >
            Picture upload
            <Plus className="ml-2 h-6 w-6 text-black" strokeWidth={3} />
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="bg-(--button-green) hover:bg-(--button-hover-green) rounded-full px-8 py-3 text-lg text-white disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400 inline-flex items-center gap-2"
          >
            {isSaving && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
