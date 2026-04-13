import { useMemo } from "react";
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
	submittingState: "approving" | "denying" | null;
	onRemarksChange: (value: string) => void;
	onApprove: () => void;
	onDeny: () => void;
	onClose: () => void;
}

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

const formatSubmittedAt = (value: string) => {
	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) return value;

	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(parsedDate);
};

export const ParentsVerificationModal = ({
	isOpen,
	verification,
	remarks,
	submittingState,
	onRemarksChange,
	onApprove,
	onDeny,
	onClose,
}: ParentsVerificationModalProps) => {
  const uploadedFiles = useMemo(() => verification?.uploadedFiles ?? [], [verification]);

  if (!isOpen || !verification) return null;

  const isPending = verification.status === "PENDING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-3 py-4 sm:px-4 sm:py-6">
      <div className="flex max-h-[95vh] w-full max-w-[760px] flex-col overflow-hidden bg-[#fbf5bf] px-5 py-5 shadow-2xl sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Verification
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-red-500 transition-transform hover:scale-105"
            aria-label="Close verification modal"
          >
            <X className="h-9 w-9" strokeWidth={2.4} />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1 sm:mt-5">
          <div className="grid gap-x-6 gap-y-4 text-lg leading-tight sm:grid-cols-[170px_1fr] sm:text-[18px]">
            <div className="font-bold text-black">Parent&apos;s name:</div>
            <div className="text-black">{verification.parentName}</div>

            <div className="font-bold text-black">Parent&apos;s Contact No:</div>
            <div className="text-black">{verification.contactNumber}</div>

            <div className="font-bold text-black">Parent&apos;s Address:</div>
            <div className="whitespace-pre-line text-black">{verification.address}</div>

            <div className="font-bold text-black">Student/s Name:</div>
            <div className="whitespace-pre-line text-black">
              {formatStudentNames(verification.studentNames)}
            </div>

            <div className="font-bold text-black">Date Submitted:</div>
            <div className="text-black">{formatSubmittedAt(verification.submittedAt)}</div>

            <div className="font-bold text-black">Status:</div>
            <div>
              <span
                className={`inline-flex rounded-full px-0 py-1 text-[15px] font-bold uppercase tracking-wide ${getStatusStyles(
                  verification.status,
                )}`}
              >
                {verification.status}
              </span>
            </div>

            <div className="font-bold text-black">Remarks:</div>
            <div>
              <textarea
                value={remarks}
                onChange={(event) => onRemarksChange(event.target.value)}
                readOnly={!isPending}
                placeholder={isPending ? "Type here..." : "No remarks provided"}
                className="h-32 w-full rounded-sm border border-black/50 bg-white px-3 py-2 text-base text-black outline-none placeholder:text-neutral-400 focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-[17px] font-normal text-black">Uploaded Files:</h3>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
              <div className="space-y-3 text-[18px] italic text-red-600 sm:pl-2">
                <p>Registration Requirements:</p>
                <ul className="list-disc space-y-3 pl-6 font-semibold">
                  <li>Parent&apos;s Birth Certificate</li>
                  <li>Government-issued ID if Parent&apos;s Birth Certificate is not available.</li>
                  <li>Child&apos;s Birth Certificate</li>
                </ul>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {uploadedFiles.map((file) => (
                    <a
                      key={file.name}
                      href={file.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[120px] flex-col items-center rounded-md bg-[#bebebe] px-2 py-3 text-center shadow-sm transition-all hover:bg-[#b0b0b0] hover:shadow-md active:scale-95"
                      title={`Click to view ${file.name}`}
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-red-500 text-white shadow-sm">
                        <div className="flex flex-col items-center gap-0.5">
                          <FileText className="h-7 w-7" strokeWidth={2.3} />
                          <span className="text-[9px] font-bold tracking-wide">
                            {file.name.toLowerCase().endsWith(".pdf") ? "PDF" : "FILE"}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 w-full truncate text-[11px] font-medium text-neutral-800">
                        {file.name}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onApprove}
            disabled={!isPending || submittingState !== null}
            className="rounded-full px-6 py-3 text-[18px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:px-7"
            style={{ backgroundColor: "#4ea85d" }}
          >
            {submittingState === "approving" ? "Approving..." : "Approve Registration"}
          </button>
          <button
            type="button"
            onClick={onDeny}
            disabled={!isPending || submittingState !== null}
            className="rounded-full px-6 py-3 text-[18px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:px-7"
            style={{ backgroundColor: "#cd301e" }}
          >
            {submittingState === "denying" ? "Denying..." : "Deny Registration"}
          </button>
        </div>
      </div>
    </div>
	);
};
