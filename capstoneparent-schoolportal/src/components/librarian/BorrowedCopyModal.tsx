import React from 'react';
import { ChevronDown, Search } from 'lucide-react';
import BorrowerDetailsModal from './BorrowerDetailsModal';
import {
	getBorrowedResources,
	setBorrowedResourceStatus,
	subscribeBorrowedResources,
	type BorrowedResourceItem,
	type CopyStatus,
} from '@/lib/borrowedResources';

const statusOptions: CopyStatus[] = ['BORROWED', 'AVAILABLE', 'LOST', 'GIVEN'];

const statusBgClass = (status: CopyStatus) => {
	if (status === 'AVAILABLE') {
		return 'bg-green-100 text-green-700';
	}
	if (status === 'LOST') {
		return 'bg-red-100 text-red-700';
	}
	if (status === 'GIVEN') {
		return 'bg-amber-100 text-amber-700';
	}
	return 'bg-blue-100 text-blue-700';
};

const BorrowedCopyModal: React.FC = () => {
	const [searchTerm, setSearchTerm] = React.useState('');
	const [statusFilter, setStatusFilter] = React.useState<string>('All');
	const [subjectFilter, setSubjectFilter] = React.useState<string>('All');
	const [gradeFilter, setGradeFilter] = React.useState<string>('All');
	const [items, setItems] = React.useState<BorrowedResourceItem[]>(() => getBorrowedResources());
	const [openStatusForId, setOpenStatusForId] = React.useState<string | null>(null);
	const [selectedItem, setSelectedItem] = React.useState<BorrowedResourceItem | null>(null);

	React.useEffect(() => {
		setItems(getBorrowedResources());
		return subscribeBorrowedResources(() => setItems(getBorrowedResources()));
	}, []);

	const filteredItems = items.filter((item) => {
		const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
		const matchesSubject = subjectFilter === 'All' || item.subject === subjectFilter;
		const matchesGrade = gradeFilter === 'All' || item.gradeLevel === gradeFilter;

		return matchesSearch && matchesStatus && matchesSubject && matchesGrade;
	});

	const updateItemStatus = (id: string, status: CopyStatus) => {
		const targetItem = items.find((item) => item.id === id);
		if (!targetItem) {
			return;
		}

		setBorrowedResourceStatus(targetItem, status);
		setSelectedItem((currentItem) => (currentItem && currentItem.id === id ? { ...currentItem, status } : currentItem));

		if (status !== 'BORROWED') {
			setSelectedItem((currentItem) => (currentItem && currentItem.id === id ? null : currentItem));
		}

		setOpenStatusForId(null);
	};

	const getDateAndTime = (value?: string) => {
		if (!value) {
			return { date: 'N/A', time: 'N/A' };
		}

		const [date, ...timeParts] = value.split(' ');
		return {
			date,
			time: timeParts.join(' ') || 'N/A',
		};
	};

	const subjectOptions = Array.from(new Set(items.map((item) => item.subject))).sort();
	const gradeOptions = Array.from(new Set(items.map((item) => item.gradeLevel))).sort();

	const handleClearFilters = () => {
		setSearchTerm('');
		setStatusFilter('All');
		setSubjectFilter('All');
		setGradeFilter('All');
	};

	return (
		<>
			<div className="mx-auto max-w-280 rounded-lg bg-white shadow-md p-6">
				<div className="flex flex-col gap-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
						<input
							type="text"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Search item"
							className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
						/>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
							<div className="relative">
								<select
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
									className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
								>
									<option>All</option>
									<option>BORROWED</option>
									<option>AVAILABLE</option>
									<option>LOST</option>
									<option>GIVEN</option>
								</select>
								<ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
							</div>

							<div className="relative">
								<select
									value={subjectFilter}
									onChange={(event) => setSubjectFilter(event.target.value)}
									className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
								>
									<option>All</option>
									{subjectOptions.map((subject) => (
										<option key={subject}>{subject}</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
							</div>

							<div className="relative">
								<select
									value={gradeFilter}
									onChange={(event) => setGradeFilter(event.target.value)}
									className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-(--button-green)"
								>
									<option>All</option>
									{gradeOptions.map((grade) => (
										<option key={grade}>{grade}</option>
									))}
								</select>
								<ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
							</div>
						</div>

						<button
							type="button"
							onClick={handleClearFilters}
							className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 sm:shrink-0"
						>
							Clear Filter
						</button>
					</div>

					<div className="space-y-3">
						{filteredItems.length === 0 && (
							<div className="rounded-md border border-gray-200 p-6 text-center text-gray-500">
								No borrowed items found.
							</div>
						)}

						{filteredItems.map((item) => (
							<div
								key={item.id}
								className="rounded-md border border-gray-200 p-4"
							>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px] sm:items-center">
									<button
										type="button"
										onClick={() => setSelectedItem(item)}
										className="text-left cursor-pointer"
									>
										<h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
										<p className="mt-1 text-sm text-gray-600">
											Borrower: <span className="font-semibold">{item.borrower}</span>
										</p>
									</button>

									<div className="relative">
										<button
											type="button"
											onClick={() => setOpenStatusForId((current) => (current === item.id ? null : item.id))}
											className={`w-full rounded-full px-4 py-2 text-sm font-bold cursor-pointer ${statusBgClass(item.status)}`}
										>
											{item.status}
										</button>

										{item.dueDate && (
											<p className={`mt-2 text-xs font-semibold ${item.isOverdue ? 'text-red-600' : 'text-green-600'}`}>
												Due: {item.dueDate}
											</p>
										)}

										{openStatusForId === item.id && (
											<div className="absolute right-0 top-10 z-20 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
												{statusOptions.map((status) => (
													<button
														key={status}
														type="button"
														onClick={() => updateItemStatus(item.id, status)}
														className={`w-full px-3 py-2 text-left text-xs font-semibold cursor-pointer ${statusBgClass(status)}`}
													>
														{status}
													</button>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{selectedItem && (
				<BorrowerDetailsModal
					onClose={() => setSelectedItem(null)}
					itemName={selectedItem.title}
					status={selectedItem.status}
					onStatusChange={(nextStatus) => updateItemStatus(selectedItem.id, nextStatus)}
					borrowedDate={selectedItem.borrowedDate}
					borrowedTime={selectedItem.borrowedTime}
					dueDate={getDateAndTime(selectedItem.dueDate).date}
					dueTime={getDateAndTime(selectedItem.dueDate).time}
					borrowerName={selectedItem.borrower}
					gradeLevel={selectedItem.gradeLevel}
					section={selectedItem.section}
				/>
			)}
		</>
	);
};

export default BorrowedCopyModal;
