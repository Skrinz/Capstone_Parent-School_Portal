import { useEffect, useMemo, useState } from "react";
import { FileText, X } from "lucide-react";

export interface ParentVerificationFile {
	name: string;
	url?: string;
	filePath?: string;
}

export interface ParentVerificationRecord {
	id: number;
	parentName: string;
	contactNumber: string;
	address: string;
	studentNames: string[];
	status: "PENDING" | "DENIED" | "VERIFIED";
	submittedAt: string;
	remarks?: string;
	uploadedFiles: ParentVerificationFile[];
}

interface ParentsVerificationModalProps {
	isOpen: boolean;
	verification: ParentVerificationRecord | null;
	remarks: string;
	onRemarksChange: (value: string) => void;
	onApprove: () => void;
	onDeny: () => void;
	onClose: () => void;
}

const getStatusLabel = (status: ParentVerificationRecord["status"]) => {
	switch (status) {
		case "PENDING":
			return "Pending Verification";
		case "VERIFIED":
			return "Verified";
		case "DENIED":
			return "Denied";
	}
};

const getStatusStyles = (status: ParentVerificationRecord["status"]) => {
	switch (status) {
		case "PENDING":
			return "bg-amber-100 text-amber-700";
		case "VERIFIED":
			return "bg-emerald-100 text-emerald-700";
		case "DENIED":
			return "bg-red-100 text-red-700";
	}
};

const formatStudentNames = (studentNames: string[]) =>
	studentNames.length > 0 ? studentNames.join("\n") : "No student linked";

export const ParentsVerificationModal = ({
	isOpen,
	verification,
	remarks,
	onRemarksChange,
	onApprove,
	onDeny,
	onClose,
}: ParentsVerificationModalProps) => {
	const uploadedFiles = verification?.uploadedFiles ?? [];
	const [selectedFileName, setSelectedFileName] = useState(uploadedFiles[0]?.name ?? "");

	useEffect(() => {
		setSelectedFileName(uploadedFiles[0]?.name ?? "");
	}, [verification?.id, uploadedFiles]);

	const selectedFile = useMemo(
		() => uploadedFiles.find((file) => file.name === selectedFileName) ?? uploadedFiles[0] ?? null,
		[uploadedFiles, selectedFileName]
	);

	const selectedFileUrl = selectedFile?.url || selectedFile?.filePath || "";

	const handleFileClick = (file: ParentVerificationFile) => {
		setSelectedFileName(file.name);
	};

	const handleOpenInNewTab = () => {
		if (!selectedFileUrl) return;
		window.open(selectedFileUrl, "_blank", "noopener,noreferrer");
	};

	if (!isOpen || !verification) return null;

	const isPending = verification.status === "PENDING";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
			<div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#d8c97b] bg-[#fbf3bf] shadow-2xl">
				<div className="flex items-start justify-between px-8 pt-8 pb-5">
					<h2 className="text-4xl font-bold tracking-tight text-black">Verification</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-red-600 transition-transform hover:scale-105 hover:text-red-700"
						aria-label="Close verification modal"
					>
						<X className="h-10 w-10" strokeWidth={2.5} />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-8 pb-8">
					<div className="grid gap-x-8 gap-y-4 text-[22px] leading-tight md:grid-cols-[220px_1fr] md:gap-y-5">
						<div className="font-bold text-black">Parent&apos;s name:</div>
						<div className="text-black">{verification.parentName}</div>

						<div className="font-bold text-black">Parent&apos;s Contact No:</div>
						<div className="text-black">{verification.contactNumber}</div>

						<div className="font-bold text-black">Parent&apos;s Address:</div>
						<div className="whitespace-pre-line text-black">{verification.address}</div>

						<div className="font-bold text-black">Student/s Name:</div>
						<div className="whitespace-pre-line text-black">{formatStudentNames(verification.studentNames)}</div>

						<div className="font-bold text-black">Date Submitted:</div>
						<div className="text-black">{verification.submittedAt}</div>

						<div className="font-bold text-black">Status:</div>
						<div>
							<span className={`inline-flex rounded-full px-3 py-1 text-lg font-bold ${getStatusStyles(verification.status)}`}>
								{getStatusLabel(verification.status)}
							</span>
						</div>

						<div className="font-bold text-black">Remarks:</div>
						<div>
							<textarea
								value={remarks}
								onChange={(event) => onRemarksChange(event.target.value)}
								readOnly={!isPending}
								placeholder={isPending ? "Type here..." : "No remarks provided"}
								className="h-32 w-full max-w-4xl rounded-sm border border-black/70 bg-white px-4 py-3 text-lg text-black outline-none placeholder:text-neutral-400 focus:border-neutral-700"
							/>
						</div>
					</div>

					<div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
						<div className="text-black">
							<h3 className="mb-4 text-2xl font-medium">Uploaded Files:</h3>
							<div className="space-y-4 pl-4 text-lg italic text-red-700">
								<p>Registration Requirements:</p>
								<ul className="list-disc space-y-4 pl-7 font-semibold">
									<li>Parent&apos;s Birth Certificate</li>
									<li>Government-issued ID if Parent&apos;s Birth Certificate is not available.</li>
									<li>Child&apos;s Birth Certificate</li>
								</ul>
							</div>
						</div>

						<div>
							<div className="mb-4 flex items-center justify-between gap-3">
								<p className="text-sm font-semibold uppercase tracking-wide text-black/60">Click a file to preview</p>
								<button
									type="button"
									onClick={handleOpenInNewTab}
									disabled={!selectedFileUrl}
									className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
								>
									Open PDF
								</button>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{verification.uploadedFiles.map((file) => {
									const content = (
										<div className="flex min-h-36 flex-col items-center rounded-lg bg-neutral-300/80 px-3 py-4 text-center transition-transform group-hover:-translate-y-0.5">
											<div className="flex h-24 w-24 items-center justify-center rounded-md bg-red-500 text-white shadow-sm">
												<div className="flex flex-col items-center gap-1">
													<FileText className="h-11 w-11" strokeWidth={2.2} />
													<span className="text-xs font-bold tracking-wide">PDF</span>
												</div>
											</div>
											<p className="mt-2 w-full truncate text-sm text-neutral-700">{file.name}</p>
										</div>
									);

									const isSelected = selectedFile?.name === file.name;

									return (
										<button
											key={file.name}
											type="button"
											onClick={() => handleFileClick(file)}
											className={`group block text-left ${isSelected ? "ring-2 ring-black/70" : ""}`}
										>
											{content}
										</button>
									);
								})}
							</div>

							<div className="mt-4 rounded-xl border border-black/20 bg-white/80 p-4 shadow-sm">
								<p className="mb-2 text-sm font-semibold uppercase tracking-wide text-black/60">Preview</p>
								{selectedFileUrl ? (
									<iframe
										title={selectedFile?.name ?? "PDF Preview"}
										src={selectedFileUrl}
										className="w-full rounded-lg border border-black/20 bg-white"
										style={{ height: "420px" }}
									/>
								) : (
									<div
										className="flex items-center justify-center rounded-lg border border-dashed border-black/20 bg-white text-sm text-black/50"
										style={{ height: "420px" }}
									>
										This file does not have a viewable path yet.
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-4 px-8 pb-8 pt-2 md:flex-row md:items-center md:justify-between">
					<button
						type="button"
						onClick={onApprove}
						disabled={!isPending}
						className="rounded-full px-8 py-4 text-2xl font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
						style={{ backgroundColor: "#56b35f" }}
					>
						Approve Registration
					</button>

					<button
						type="button"
						onClick={onDeny}
						disabled={!isPending}
						className="rounded-full px-8 py-4 text-2xl font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
						style={{ backgroundColor: "#cc2f1f" }}
					>
						Deny Registration
					</button>
				</div>
			</div>
		</div>
	);
};
