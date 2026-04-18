import React from "react";
import { Modal } from "../ui/modal";

type BorrowCopyStatus = "BORROWED" | "AVAILABLE" | "LOST" | "GIVEN";

interface BorrowerDetailsModalProps {
  onClose: () => void;
  itemName?: string;
  status?: BorrowCopyStatus;
  onStatusChange?: (status: BorrowCopyStatus) => void | Promise<void>;
  isSaving?: boolean;
  borrowedDate?: string;
  borrowedTime?: string;
  dueDate?: string;
  dueTime?: string;
  borrowerName?: string;
  gradeLevel?: string;
  section?: string;
}

const statusOptions: BorrowCopyStatus[] = [
  "BORROWED",
  "AVAILABLE",
  "LOST",
  "GIVEN",
];

const BorrowerDetailsModal: React.FC<BorrowerDetailsModalProps> = ({
  onClose,
  itemName = "Chess Board 2",
  status = "BORROWED",
  onStatusChange,
  isSaving = false,
  borrowedDate = "04/02/25",
  borrowedTime = "10:00 AM",
  dueDate = "04/08/25",
  dueTime = "10:00 AM",
  borrowerName = "Elsa Frost",
  gradeLevel = "Grade 1",
  section = "Pearl",
}) => {
  const [selectedStatus, setSelectedStatus] =
    React.useState<BorrowCopyStatus>(status);

  React.useEffect(() => {
    setSelectedStatus(status);
  }, [status]);

  const handleStatusChange = async (nextStatus: BorrowCopyStatus) => {
    setSelectedStatus(nextStatus);
    try {
      await onStatusChange?.(nextStatus);
      onClose();
    } catch {
      setSelectedStatus(status);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Borrower Details">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
          <div className="rounded-md bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">
            ITEM NAME: {itemName}
          </div>
          <select
            value={selectedStatus}
            onChange={(event) =>
              void handleStatusChange(event.target.value as BorrowCopyStatus)
            }
            disabled={isSaving}
            className="w-full px-4 py-3 text-sm font-semibold border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-sm font-bold text-gray-700">Time Borrowed</p>
            <p className="text-sm text-gray-600">
              {borrowedDate} {borrowedTime}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 p-3">
            <p className="text-sm font-bold text-gray-700">Due</p>
            <p className="text-sm text-gray-600">
              {dueDate} {dueTime}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="rounded-md border border-gray-200 p-3 space-y-1 text-sm text-gray-700">
            <p>
              <span className="font-bold">Name:</span> {borrowerName}
            </p>
            <p>
              <span className="font-bold">Grade Level:</span> {gradeLevel}
            </p>
            <p>
              <span className="font-bold">Section:</span> {section}
            </p>
          </div>
          {isSaving && (
            <p className="text-sm font-medium text-gray-500 whitespace-nowrap">
              Saving status...
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BorrowerDetailsModal;
