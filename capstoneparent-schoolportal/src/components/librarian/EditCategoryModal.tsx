import React from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";

interface EditCategoryModalProps {
	onClose: () => void;
	onEdit?: (categoryName: string) => void;
	initialCategoryName?: string;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
	onClose,
	onEdit,
	initialCategoryName = "",
}) => {
	const [categoryName, setCategoryName] = React.useState(initialCategoryName);
	const hasChanges = categoryName.trim() !== initialCategoryName.trim();

	const handleEdit = () => {
		const trimmedCategoryName = categoryName.trim();
		if (!trimmedCategoryName) {
			return;
		}

		onEdit?.(trimmedCategoryName);
		onClose();
	};

	return (
		<Modal isOpen={true} onClose={onClose} title="Edit Category">
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
						className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg rounded-full"
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleEdit}
						disabled={!hasChanges}
						className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400"
					>
						Save
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default EditCategoryModal;
