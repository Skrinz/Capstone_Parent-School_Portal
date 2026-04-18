import React from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";

interface AddCategoryModalProps {
	onClose: () => void;
	onAdd?: (categoryName: string) => Promise<void> | void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onAdd }) => {
	const [categoryName, setCategoryName] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const handleAdd = async () => {
		const trimmedCategoryName = categoryName.trim();
		if (!trimmedCategoryName || isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onAdd?.(trimmedCategoryName);
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={true} onClose={onClose} title="Add Category">
			<div className="space-y-4">
				<input
					type="text"
					value={categoryName}
					onChange={(event) => setCategoryName(event.target.value)}
					placeholder="Category name"
					className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
				/>
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg rounded-full"
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => void handleAdd()}
						disabled={isSubmitting || !categoryName.trim()}
						className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full disabled:bg-gray-400 disabled:hover:bg-gray-400"
					>
						{isSubmitting ? "Adding..." : "Add"}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default AddCategoryModal;
