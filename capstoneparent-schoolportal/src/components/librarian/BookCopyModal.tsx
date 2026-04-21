import React from "react";
import { Plus } from "lucide-react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import AddBookCopyModal from "./AddBookCopyModal";
import BorrowerModal from "./BorrowerModal";
import { Loader } from "../ui/Loader";
import { libraryApi } from "@/lib/api/libraryApi";
import type {
  BorrowerLookupResult,
  LearningMaterial,
  MaterialCopy,
} from "@/lib/api/types";

interface BookCopyModalProps {
  onClose: () => void;
  material: LearningMaterial;
  onMaterialUpdated?: (material: LearningMaterial) => void | Promise<void>;
}

const BookCopyModal: React.FC<BookCopyModalProps> = ({
  onClose,
  material,
  onMaterialUpdated,
}) => {
  const [filterStatus, setFilterStatus] = React.useState<string>("Status");
  const [isAddCopyModalOpen, setIsAddCopyModalOpen] = React.useState(false);
  const [selectedCopyId, setSelectedCopyId] = React.useState<number | null>(null);
  const [copies, setCopies] = React.useState<MaterialCopy[]>(material.copies || []);
  const [loading, setLoading] = React.useState(false);
  const [isBorrowing, setIsBorrowing] = React.useState(false);

  React.useEffect(() => {
    setCopies(material.copies || []);
  }, [material]);

  const existingCopyCodes = copies.map((copy) => copy.copy_code);

  const syncMaterial = async () => {
    setLoading(true);
    try {
      const response = await libraryApi.getMaterialById(material.item_id);
      setCopies(response.data.copies || []);
      await onMaterialUpdated?.(response.data);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCopies = async (copyNumbers: number[]) => {
    setLoading(true);
    try {
      await Promise.all(
        copyNumbers.map((copy_code) =>
          libraryApi.addCopy(material.item_id, { copy_code }),
        ),
      );
      await syncMaterial();
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (borrower: BorrowerLookupResult) => {
    if (!selectedCopyId) return;

    setIsBorrowing(true);
    try {
      await libraryApi.borrowMaterial({
        copy_id: selectedCopyId,
        student_id: borrower.student_id,
        user_id: borrower.user_id,
      });
      setSelectedCopyId(null);
      await syncMaterial();
    } finally {
      setIsBorrowing(false);
    }
  };

  const lookupBorrowers = async (query: string) => {
    const response = await libraryApi.lookupBorrowers(query);
    return response.data;
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={`${material.item_type === "Book" ? "Book" : "Resource"} Copies`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
              Name: {material.item_name}
            </div>
            <div className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
              Subject: {material.subject?.name ?? material.category?.category_name ?? "N/A"}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              onClick={() => setIsAddCopyModalOpen(true)}
              className="bg-(--button-green) text-white hover:bg-(--button-hover-green)"
            >
              <Plus className="h-4 w-4" />
              Add Copy
            </Button>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--button-green)"
            >
              <option value="Status">Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="BORROWED">Borrowed</option>
              <option value="LOST">Lost</option>
              <option value="GIVEN">Given</option>
            </select>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <Loader />
            ) : (
              <>
                {copies
                  .filter((copy) => filterStatus === "Status" || copy.status === filterStatus)
                  .map((copy) => (
                    <div
                      key={copy.copy_id}
                      className="cursor-pointer rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-semibold text-gray-900">Copy {copy.copy_code}</p>
                          <p className="text-sm text-gray-600">
                            {copy.status === "AVAILABLE"
                              ? `Added: ${new Date(copy.added_at).toLocaleDateString()}`
                              : `Status: ${copy.status}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              copy.status === "AVAILABLE"
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {copy.status}
                          </span>
                          {copy.status === "AVAILABLE" && (
                            <Button
                              type="button"
                              onClick={() => setSelectedCopyId(copy.copy_id)}
                              className="bg-(--button-green) text-white hover:bg-(--button-hover-green)"
                            >
                              Borrow
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {copies.length === 0 && (
                  <div className="py-4 text-center text-gray-500">
                    No copies available. Add one!
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      {isAddCopyModalOpen && (
        <AddBookCopyModal
          onClose={() => setIsAddCopyModalOpen(false)}
          bookTitle={material.item_name}
          itemLabel={material.item_type === "Book" ? "Book" : "Learning Resource"}
          onAddCopies={handleAddCopies}
          existingCopyCodes={existingCopyCodes}
        />
      )}

      {selectedCopyId && (
        <BorrowerModal
          onClose={() => setSelectedCopyId(null)}
          onConfirm={handleBorrow}
          lookupBorrowers={lookupBorrowers}
          confirmLabel={isBorrowing ? "Saving..." : "Confirm"}
        />
      )}
    </>
  );
};

export default BookCopyModal;
