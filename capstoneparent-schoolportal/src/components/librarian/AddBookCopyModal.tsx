import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AddNumberOfCopiesModal from './AddNumberOfCopiesModal';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

interface AddBookCopyModalProps {
	onClose: () => void;
	bookTitle?: string;
	itemLabel?: string;
	onAddCopies: (copyNumbers: number[]) => Promise<void>;
	existingCopyCodes: number[];
}

const getNextAvailableCopyNumbers = (existingCopyNumbers: Set<number>, numberOfCopies: number) => {
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

const AddBookCopyModal: React.FC<AddBookCopyModalProps> = ({
	onClose,
	bookTitle = 'Book',
	itemLabel = 'Book',
	onAddCopies,
	existingCopyCodes,
}) => {
	const [newCopies, setNewCopies] = React.useState<number[]>([]);
	const [isAddNumberModalOpen, setIsAddNumberModalOpen] = React.useState(false);
	const [isSaving, setIsSaving] = React.useState(false);
	const [savingCount, setSavingCount] = React.useState(0);
	const { showError, clearFeedback } = useApiFeedbackStore();

	const copyLabel = (count: number) => `${count} ${count === 1 ? 'copy' : 'copies'}`;

	const handleAddCopies = (numberOfCopies: number) => {
		const existingSet = new Set([...existingCopyCodes, ...newCopies]);
		const nextCopyNumbers = getNextAvailableCopyNumbers(existingSet, numberOfCopies);
		setNewCopies((prev) => [...prev, ...nextCopyNumbers].sort((a, b) => a - b));
	};

	const handleRemoveCopy = (copyNumber: number) => {
		setNewCopies((prev) => prev.filter((c) => c !== copyNumber));
	};

	const handleSave = async () => {
		if (newCopies.length === 0) {
			onClose();
			return;
		}

		clearFeedback();

		setIsSaving(true);
		setSavingCount(newCopies.length);
		try {
			await onAddCopies(newCopies);
			onClose();
		} catch (error) {
			console.error("Failed to add copies", error);
			showError(error instanceof Error ? error.message : "Failed to add book copies.");
		} finally {
			setIsSaving(false);
			setSavingCount(0);
		}
	};

	return (
		<>
			<Modal isOpen={true} onClose={onClose} title={`Add ${itemLabel} Copies`}>
				<div className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
						Copying: {bookTitle}
						</div>
						<Button
							type="button"
							onClick={() => setIsAddNumberModalOpen(true)}
							disabled={isSaving}
							className="bg-(--button-green) hover:bg-(--button-hover-green) text-white"
						>
							<Plus className="h-4 w-4" />
							Add Copy
						</Button>
					</div>

					<div className="max-h-80 overflow-y-auto space-y-3 border border-gray-200 rounded-md p-3">
						{newCopies.map((copyNum) => (
							<div key={copyNum} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-4 py-3">
								<span className="text-sm font-medium text-gray-800">{bookTitle} - Copy {copyNum}</span>
								<button
									type="button"
									onClick={() => handleRemoveCopy(copyNum)}
									className="text-red-600 hover:text-red-700 cursor-pointer"
									aria-label={`Remove Copy`}
								>
									<Trash2 className="h-5 w-5" />
								</button>
							</div>
						))}
						{newCopies.length === 0 && (
							<div className="text-center text-gray-500 text-sm">No new copies staged. Click 'Add Copy' to begin.</div>
						)}
					</div>
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							onClick={onClose}
							disabled={isSaving}
							className="bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 text-lg rounded-full"
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSave}
							disabled={isSaving || newCopies.length === 0}
							className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full disabled:opacity-50"
						>
							{isSaving ? `Saving ${copyLabel(savingCount)}...` : `Save ${itemLabel} Copies`}
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
