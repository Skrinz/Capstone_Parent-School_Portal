import React from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';

interface AddBookModalProps {
	onClose: () => void;
	onAdd?: (book: { title: string; author: string; subject: string; gradeLevel: string }) => void;
	subjectOptions: string[];
}

const AddBookModal: React.FC<AddBookModalProps> = ({ onClose, onAdd, subjectOptions }) => {
	const [bookTitle, setBookTitle] = React.useState('');
	const [authorName, setAuthorName] = React.useState('');
	const [subject, setSubject] = React.useState('SUBJECT');
	const [gradeLevel, setGradeLevel] = React.useState('GRADE LEVEL');

	const handleAdd = () => {
		if (!bookTitle.trim() || subject === 'SUBJECT' || gradeLevel === 'GRADE LEVEL') {
			return;
		}

		onAdd?.({
			title: bookTitle.trim(),
			author: authorName.trim(),
			subject,
			gradeLevel,
		});
		onClose();
	};

	return (
		<Modal isOpen={true} onClose={onClose} title="Add Book">
			<div className="space-y-4">
				<input
					type="text"
					value={bookTitle}
					onChange={(event) => setBookTitle(event.target.value)}
					placeholder="Name of Book"
					className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
				/>
				<input
					type="text"
					value={authorName}
					onChange={(event) => setAuthorName(event.target.value)}
					placeholder="Name of Author (Optional)"
					className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
				/>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<select
						value={subject}
						onChange={(event) => setSubject(event.target.value)}
						className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
					>
						<option value="SUBJECT">SUBJECT</option>
						{subjectOptions.map((option) => (
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
						<option value="Grade 1">Grade 1</option>
						<option value="Grade 2">Grade 2</option>
						<option value="Grade 3">Grade 3</option>
						<option value="Grade 4">Grade 4</option>
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
						onClick={handleAdd}
						className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full"
					>
						Add
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default AddBookModal;
