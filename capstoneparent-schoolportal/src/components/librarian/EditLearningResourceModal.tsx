import React from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface EditLearningResourceModalProps {
	onClose: () => void;
	onSave?: (resource: { title: string; category: string; gradeLevel: string }) => void;
	initialResource?: {
		title?: string;
		category?: string;
		gradeLevel?: string;
	};
	categoryOptions: string[];
	gradeOptions: string[];
}

const EditLearningResourceModal: React.FC<EditLearningResourceModalProps> = ({
	onClose,
	onSave,
	initialResource,
	categoryOptions,
	gradeOptions,
}) => {
	const [resourceTitle, setResourceTitle] = React.useState(initialResource?.title ?? '');
	const [category, setCategory] = React.useState(initialResource?.category ?? 'CATEGORY');
	const [gradeLevel, setGradeLevel] = React.useState(initialResource?.gradeLevel ?? 'GRADE LEVEL');
	const hasChanges =
		resourceTitle.trim() !== (initialResource?.title ?? '').trim() ||
		category !== (initialResource?.category ?? 'CATEGORY') ||
		gradeLevel !== (initialResource?.gradeLevel ?? 'GRADE LEVEL');

	const handleSave = () => {
		if (!resourceTitle.trim() || category === 'CATEGORY' || gradeLevel === 'GRADE LEVEL') {
			return;
		}

		onSave?.({
			title: resourceTitle.trim(),
			category,
			gradeLevel,
		});
		onClose();
	};

	return (
		<Modal isOpen={true} onClose={onClose} title="Edit Learning Resource">
			<div className="space-y-4">
				<input
					type="text"
					value={resourceTitle}
					onChange={(event) => setResourceTitle(event.target.value)}
					placeholder="Name of Learning Resource"
					className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
				/>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<select
						value={category}
						onChange={(event) => setCategory(event.target.value)}
						className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
					>
						<option value="CATEGORY">CATEGORY</option>
						{categoryOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<select
						value={gradeLevel}
						onChange={(event) => setGradeLevel(event.target.value)}
						className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
					>
						<option value="GRADE LEVEL">GRADE LEVEL</option>
						{gradeOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</div>
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
						onClick={handleSave}
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

export default EditLearningResourceModal;
