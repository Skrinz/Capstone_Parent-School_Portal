import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AddNumberOfCopiesModal from './AddNumberOfCopiesModal';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface AddBookCopyModalProps {
	onClose: () => void;
	bookTitle?: string;
}

interface BookCopyItem {
	id: number;
	copyNumber: number;
}

const buildCopyLabel = (bookTitle: string, copyNumber: number) => `${bookTitle} ${copyNumber}`;

const getNextAvailableCopyNumbers = (copies: BookCopyItem[], numberOfCopies: number) => {
	const existingCopyNumbers = new Set(copies.map((copy) => copy.copyNumber));
	const nextCopyNumbers: number[] = [];
	let candidateCopyNumber = 1;

	while (nextCopyNumbers.length < numberOfCopies) {
		if (!existingCopyNumbers.has(candidateCopyNumber)) {
			nextCopyNumbers.push(candidateCopyNumber);
		}
		candidateCopyNumber += 1;
	}

	return nextCopyNumbers;
};

const AddBookCopyModal: React.FC<AddBookCopyModalProps> = ({ onClose, bookTitle = 'Book' }) => {
	const [copies, setCopies] = React.useState<BookCopyItem[]>(
		Array.from({ length: 3 }, (_, index) => ({
			id: index + 1,
			copyNumber: index + 1,
		}))
	);
	const [isAddNumberModalOpen, setIsAddNumberModalOpen] = React.useState(false);

	const handleAddCopies = (numberOfCopies: number) => {
		setCopies((previousCopies) => {
			const nextCopyNumbers = getNextAvailableCopyNumbers(previousCopies, numberOfCopies);
			const newCopies = nextCopyNumbers.map((copyNumber, index) => ({
				id: Date.now() + index,
				copyNumber,
			}));

			return [...previousCopies, ...newCopies].sort((leftCopy, rightCopy) => leftCopy.copyNumber - rightCopy.copyNumber);
		});
	};

	const handleRemoveCopy = (id: number) => {
		setCopies((previousCopies) => previousCopies.filter((copy) => copy.id !== id));
	};

	return (
		<>
			<Modal isOpen={true} onClose={onClose} title="Add Book Copies">
				<div className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
						Name: {bookTitle}
						</div>
						<Button
							type="button"
							onClick={() => setIsAddNumberModalOpen(true)}
							className="bg-(--button-green) hover:bg-(--button-hover-green) text-white"
						>
							<Plus className="h-4 w-4" />
							Add Copy
						</Button>
					</div>

					<div className="max-h-80 overflow-y-auto space-y-3 border border-gray-200 rounded-md p-3">
						{copies.map((copy) => (
							<div key={copy.id} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-4 py-3">
								<span className="text-sm font-medium text-gray-800">{buildCopyLabel(bookTitle, copy.copyNumber)}</span>
								<button
									type="button"
									onClick={() => handleRemoveCopy(copy.id)}
									className="text-red-600 hover:text-red-700 cursor-pointer"
									aria-label={`Remove ${buildCopyLabel(bookTitle, copy.copyNumber)}`}
								>
									<Trash2 className="h-5 w-5" />
								</button>
							</div>
						))}
					</div>
					<div className="flex justify-end">
						<Button
							type="button"
							onClick={onClose}
							className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg rounded-full"
						>
							Done
						</Button>
					</div>
				</div>
			</Modal>

			{isAddNumberModalOpen && (
				<AddNumberOfCopiesModal
					onClose={() => setIsAddNumberModalOpen(false)}
					onAdd={handleAddCopies}
				/>
			)}
		</>
	);
};

export default AddBookCopyModal;
