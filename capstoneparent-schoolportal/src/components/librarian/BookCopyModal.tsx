import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import AddBookCopyModal from './AddBookCopyModal';
import BorrowerDetailsModal from './BorrowerDetailsModal';
import { setBorrowedResourceStatus, type BorrowedResourceItem, type CopyStatus } from '@/lib/borrowedResources';

interface BookCopyItem {
  id: number;
  title: string;
  status: CopyStatus;
  borrower: string | null;
  timeBorrowed: string | null;
  dueDate: string;
  dueColor: string;
  gradeLevel: string;
  section: string;
}

interface BookCopyModalProps {
  onClose: () => void;
  bookTitle?: string;
  bookSubject?: string;
}

const BookCopyModal: React.FC<BookCopyModalProps> = ({
  onClose,
  bookTitle = 'The New Science Links',
  bookSubject = 'Science',
}) => {
  const [filterStatus, setFilterStatus] = React.useState<string>('Status');
  const [copyStatuses, setCopyStatuses] = React.useState<Record<number, CopyStatus>>({});
  const [isAddCopyModalOpen, setIsAddCopyModalOpen] = React.useState(false);
  const [selectedCopy, setSelectedCopy] = React.useState<BookCopyItem | null>(null);

  const copies: BookCopyItem[] = [
    {
      id: 1,
      title: `${bookTitle} 1`,
      status: "AVAILABLE",
      borrower: null,
      timeBorrowed: null,
      dueDate: "N/A",
      dueColor: "text-gray-400",
      gradeLevel: 'Grade 1',
      section: 'Pearl',
    },
    {
      id: 2,
      title: `${bookTitle} 2`,
      status: "BORROWED",
      borrower: "Pedro Parker",
      timeBorrowed: '04/02/25 10:00 AM',
      dueDate: "04/09/25 10:00 AM",
      dueColor: "text-green-500",
      gradeLevel: 'Grade 2',
      section: 'Daisy',
    },
    {
      id: 3,
      title: `${bookTitle} 3`,
      status: "BORROWED",
      borrower: "Bill Nye",
      timeBorrowed: '03/31/25 01:15 PM',
      dueDate: "04/05/25 10:00 PM",
      dueColor: "text-red-500",
      gradeLevel: 'Grade 3',
      section: 'Orchid',
    },
  ];

  const getDateAndTime = (value?: string | null) => {
    if (!value || value === 'N/A') {
      return { date: 'N/A', time: 'N/A' };
    }

    const [date, ...timeParts] = value.split(' ');
    return {
      date,
      time: timeParts.join(' ') || 'N/A',
    };
  };

  const syncBorrowedResource = (copy: BookCopyItem, status: CopyStatus) => {
    const borrowedAt = getDateAndTime(copy.timeBorrowed);
    const borrowedItem: BorrowedResourceItem = {
      id: `book:${bookTitle}:${copy.id}`,
      title: copy.title,
      borrower: copy.borrower ?? 'N/A',
      section: copy.section,
      subject: bookSubject,
      gradeLevel: copy.gradeLevel,
      status,
      borrowedDate: borrowedAt.date,
      borrowedTime: borrowedAt.time,
      dueDate: copy.dueDate === 'N/A' ? undefined : copy.dueDate,
      isOverdue: copy.dueColor.includes('red'),
    };

    setBorrowedResourceStatus(borrowedItem, status);
  };

  React.useEffect(() => {
    copies.forEach((copy) => {
      const currentStatus = copyStatuses[copy.id] || copy.status;
      syncBorrowedResource(copy, currentStatus);
    });
  }, [bookTitle, bookSubject, copyStatuses]);

  return (
  <>
  <Modal isOpen={true} onClose={onClose} title="Book Copies">
    <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
      Name: {bookTitle}
      </div>
      <div className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
      Subject: {bookSubject}
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        type="button"
        onClick={() => setIsAddCopyModalOpen(true)}
        className="bg-(--button-green) hover:bg-(--button-hover-green) text-white"
      >
      <Plus className="h-4 w-4" />
      Add Copy
      </Button>
      <select
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
      className="px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
      >
      <option>Status</option>
      <option value="AVAILABLE">Available</option>
      <option value="BORROWED">Borrowed</option>
      </select>
    </div>

    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {copies.map((copy, index) => {
      const currentStatus = copyStatuses[copy.id] || copy.status;
      return (
        <div
          key={copy.id}
          className="border border-gray-200 rounded-md p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setSelectedCopy({ ...copy, status: currentStatus })}
        >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
          <p className="font-semibold text-gray-900">Copy {index + 1}: {copy.title}</p>
          <p className="text-sm text-gray-600">
            {currentStatus === 'AVAILABLE' ? `Time Borrowed: ${copy.timeBorrowed}` : `Borrower: ${copy.borrower}`}
          </p>
          </div>
          <div className="flex items-center gap-2">
          <div className="relative">
            <select
            value={currentStatus}
            onChange={(e) => {
              const nextStatus = e.target.value as CopyStatus;
              setCopyStatuses({ ...copyStatuses, [copy.id]: nextStatus });
              syncBorrowedResource(copy, nextStatus);
            }}
            onClick={(e) => e.stopPropagation()}
            className="appearance-none rounded-full border border-gray-300 px-4 py-1 pr-8 text-sm font-semibold"
            >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="BORROWED">BORROWED</option>
            <option value="LOST">LOST</option>
            </select>
            <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <span className={`text-xs font-semibold ${copy.dueColor}`}>Due: {copy.dueDate}</span>
          </div>
        </div>
        </div>
      );
      })}
    </div>
    </div>
  </Modal>

  {isAddCopyModalOpen && (
    <AddBookCopyModal onClose={() => setIsAddCopyModalOpen(false)} bookTitle={bookTitle} />
  )}

  {selectedCopy && (
    <BorrowerDetailsModal
      onClose={() => setSelectedCopy(null)}
      itemName={selectedCopy.title}
      status={selectedCopy.status}
      onStatusChange={(nextStatus) => {
        setCopyStatuses((previousStatuses) => ({
          ...previousStatuses,
          [selectedCopy.id]: nextStatus,
        }));
        syncBorrowedResource(selectedCopy, nextStatus);
        setSelectedCopy((previousCopy) => (previousCopy ? { ...previousCopy, status: nextStatus } : previousCopy));
      }}
      borrowedDate={getDateAndTime(selectedCopy.timeBorrowed).date}
      borrowedTime={getDateAndTime(selectedCopy.timeBorrowed).time}
      dueDate={getDateAndTime(selectedCopy.dueDate).date}
      dueTime={getDateAndTime(selectedCopy.dueDate).time}
      borrowerName={selectedCopy.borrower ?? 'N/A'}
      gradeLevel={selectedCopy.gradeLevel}
      section={selectedCopy.section}
    />
  )}
  </>
  );
};

export default BookCopyModal;