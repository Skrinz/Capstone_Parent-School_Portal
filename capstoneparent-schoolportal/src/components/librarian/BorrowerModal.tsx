import React from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import type { BorrowerLookupResult } from '@/lib/api/types';
import { Loader } from '../ui/Loader';

interface BorrowerModalProps {
	onClose: () => void;
	onConfirm?: (borrower: BorrowerLookupResult) => void | Promise<void>;
	lookupBorrowers: (query: string) => Promise<BorrowerLookupResult[]>;
	title?: string;
	placeholder?: string;
	initialValue?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}

const BorrowerModal: React.FC<BorrowerModalProps> = ({
	onClose,
	onConfirm,
	lookupBorrowers,
	title = 'Name of Borrower',
	placeholder = 'Input borrower name or LRN',
	initialValue = '',
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
}) => {
	const [borrowerName, setBorrowerName] = React.useState(initialValue);
	const [matches, setMatches] = React.useState<BorrowerLookupResult[]>([]);
	const [selectedBorrower, setSelectedBorrower] = React.useState<BorrowerLookupResult | null>(null);
	const [isSearching, setIsSearching] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const normalize = (value: string) => value.trim().toLowerCase();

	const resolveBorrower = React.useCallback(
		(query: string) => {
			const normalizedQuery = normalize(query);

			if (!normalizedQuery) {
				return null;
			}

			return (
				selectedBorrower ??
				matches.find((match) => {
					const displayName = normalize(match.display_name);
					const meta = normalize(match.meta ?? '');

					return displayName === normalizedQuery || meta.includes(normalizedQuery);
				}) ??
				(matches.length === 1 ? matches[0] : null)
			);
		},
		[matches, selectedBorrower],
	);

	React.useEffect(() => {
		const query = borrowerName.trim();
		if (!query) {
			setMatches([]);
			setSelectedBorrower(null);
			return;
		}

		if (selectedBorrower && selectedBorrower.display_name === query) {
			return;
		}

		setSelectedBorrower(null);
		const timeoutId = window.setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await lookupBorrowers(query);
				setMatches(results);
			} catch {
				setMatches([]);
			} finally {
				setIsSearching(false);
			}
		}, 250);

		return () => window.clearTimeout(timeoutId);
	}, [borrowerName, lookupBorrowers, selectedBorrower]);

	const handleConfirm = async () => {
		const chosenBorrower = resolveBorrower(borrowerName);

		if (!chosenBorrower) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onConfirm?.(chosenBorrower);
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={true} onClose={onClose} title={title}>
			<div className="space-y-4">
				<input
					type="text"
					value={borrowerName}
					onChange={(event) => setBorrowerName(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							void handleConfirm();
						}
					}}
					placeholder={placeholder}
					className="w-full px-4 py-3 text-lg border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green) placeholder-gray-400"
				/>
				<div className="max-h-60 overflow-y-auto rounded-md border border-gray-200">
					{isSearching && (
						<Loader />
					)}
					{!isSearching && matches.length === 0 && borrowerName.trim() && (
						<div className="px-4 py-3 text-sm text-gray-500">No borrower found.</div>
					)}
					{matches.map((borrower) => {
						const isSelected =
							selectedBorrower?.type === borrower.type &&
							selectedBorrower?.id === borrower.id;

						return (
							<button
								key={`${borrower.type}-${borrower.id}`}
								type="button"
								onClick={() => {
									setSelectedBorrower(borrower);
									setBorrowerName(borrower.display_name);
								}}
								className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50 ${
									isSelected ? 'bg-green-50' : ''
								}`}
							>
								<div>
									<p className="font-semibold text-gray-900">{borrower.display_name}</p>
									{borrower.type === 'student' && borrower.meta && (
										<p className="text-sm text-gray-500">{borrower.meta}</p>
									)}
								</div>
								<div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
									{borrower.type === 'student'
										? borrower.grade_level ?? 'Student'
										: borrower.role_label ?? 'User'}
								</div>
							</button>
						);
					})}
				</div>
				<div className="flex justify-end gap-3">
					<Button
						type="button"
						onClick={onClose}
						className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg rounded-full"
					>
						{cancelLabel}
					</Button>
					<Button
						type="button"
						onClick={() => void handleConfirm()}
						disabled={!resolveBorrower(borrowerName) || isSubmitting}
						className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-8 py-3 text-lg rounded-full"
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</Modal>
	);
};

export default BorrowerModal;
