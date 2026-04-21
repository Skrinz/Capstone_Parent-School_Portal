import { X, Search, Loader2, Trash2 } from "lucide-react";
import type { PendingUploads } from "./parentModalTypes";
import { useState, useRef, useCallback, useEffect } from "react";
import { studentsApi } from "@/lib/api/studentsApi";
import type { StudentSearchResult } from "@/lib/api";

function useDebouncedCallback<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

interface ApplyRegistrationModalProps {
  isOpen: boolean;
  pendingUploads: PendingUploads;
  isFormValid: boolean;
  onSetUploadTarget: (target: keyof PendingUploads) => void;
  onPendingFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePendingFile: (key: keyof PendingUploads) => void;
  onClose: () => void;
  onSubmit: (student: any) => void;
  isSubmitting?: boolean;
}

export const ApplyRegistrationModal = ({
  isOpen,
  pendingUploads,
  isFormValid,
  onSetUploadTarget,
  onPendingFileChange,
  onRemovePendingFile,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ApplyRegistrationModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);

  const doSearch = useCallback(async (lrn: string) => {
    if (!lrn) {
      setResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    setShowDropdown(false);
    try {
      const json = await studentsApi.searchByLrn(lrn);
      setResults(json.data);
      setShowDropdown(true);
    } catch {
      setResults([]);
      setShowDropdown(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useDebouncedCallback(doSearch, 300);

  const handleLrnInput = (raw: string) => {
    const value = raw.replace(/\D/g, "");
    setQuery(value);
    setShowDropdown(false);
    if (value) debouncedSearch(value);
    else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleLrnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query) doSearch(query);
    }
  };

  useEffect(() => {
    const close = () => setShowDropdown(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const resetSearch = () => {
    setFoundStudent(null);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4">
      <div className="w-full max-w-3xl max-h-[90vh] sm:max-h-none rounded-xl p-6 sm:p-10 shadow-2xl overflow-y-auto" style={{ backgroundColor: "#FCF5CA" }}>
        <div className="flex items-start justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-black font-sans leading-tight">Apply for Registration</h2>
          <button
            type="button"
            onClick={() => {
              resetSearch();
              onClose();
            }}
            className="text-red-600 transition-colors hover:text-red-700 shrink-0 pt-1"
            aria-label="Close registration modal"
          >
            <X className="h-8 w-8 sm:h-10 sm:w-10" />
          </button>
        </div>

        {!foundStudent ? (
          <div className="space-y-6 py-4 flex flex-col items-center min-h-[400px] justify-center">
            <h3 className="mb-4 text-2xl font-bold text-black">Enter Student LRN</h3>
            <div className="w-full max-w-lg relative text-left">
              <div
                className="relative flex-1"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{12}"
                  minLength={12}
                  maxLength={12}
                  placeholder="Type LRN then press Enter to search"
                  value={query}
                  onChange={(e) => handleLrnInput(e.target.value)}
                  onKeyDown={handleLrnKeyDown}
                  onFocus={() => {
                    if (results.length > 0) setShowDropdown(true);
                  }}
                  className="w-full rounded-2xl border-2 border-gray-300 hover:border-gray-400 bg-white pl-14 pr-6 py-4 text-xl focus:border-gray-900 focus:outline-none placeholder:text-gray-400 transition-colors"
                />
                {isSearching && (
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400 animate-pulse select-none">
                    Searching…
                  </span>
                )}
              </div>

              {showDropdown && (
                <div
                  className="mt-3 w-full max-h-[240px] overflow-y-auto rounded-2xl border-2 border-gray-200 bg-white shadow-lg"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {results.length > 0 ? (
                    results.map((student) => {
                      const isRegistrationVerified = student.is_verified;
                      const isDisabled = isRegistrationVerified;

                      return (
                        <button
                          key={student.student_id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setFoundStudent(student);
                            setQuery("");
                            setShowDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                            isDisabled
                              ? "opacity-40 cursor-not-allowed bg-gray-50"
                              : "hover:bg-green-50 cursor-pointer"
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              LRN: {student.lrn_number}
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.fname} {student.lname} ·{" "}
                              {student.grade_level.grade_level}
                            </p>
                          </div>
                          {isRegistrationVerified && (
                            <span className="text-xs text-red-600 font-bold italic">
                              Verified by a parent
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-5 py-4 text-sm text-gray-500 text-center">
                      No enrolled students found with LRN starting with "{query}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
              <span className="text-xl sm:text-2xl text-black">Student name:</span>
              <div className="bg-white px-4 py-1 font-bold text-lg sm:text-xl min-w-[200px] text-left text-black shadow-sm">
                {foundStudent.fname} {foundStudent.lname}
              </div>
              <button
                type="button"
                onClick={resetSearch}
                className="px-4 py-2 text-sm font-bold text-white rounded shadow-sm transition-colors bg-blue-600 hover:bg-blue-700 ml-0 sm:ml-2"
              >
                Change Student
              </button>
            </div>

            <div className="text-xl sm:text-2xl mb-4 text-black">
              Uploaded Files:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 mb-8">
              {/* Left Column */}
              <div className="text-[#C0392B] md:pl-8 text-base sm:text-lg">
                <div className="italic mb-2">Registration Requirements:</div>
                <ul className="space-y-4">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span className="italic font-bold">Parent's Birth Certificate</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>
                      <span className="italic font-bold">Government-issued ID</span> <span className="italic">if Parent's Birth Certificate is not available.</span>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span className="italic font-bold">Child's Birth Certificate</span>
                  </li>
                </ul>
              </div>

              {/* Right Column */}
              <div>
                <p className="text-sm font-semibold italic text-gray-700 mb-2">Upload at least 2 files.</p>
                <label
                  htmlFor="required-files-upload"
                  onClick={() => {
                    let target: keyof PendingUploads = "parentBirthCertificate";
                    if (pendingUploads.parentBirthCertificate || pendingUploads.governmentId) {
                      if (!pendingUploads.childBirthCertificate) target = "childBirthCertificate";
                      else target = "governmentId";
                    }
                    onSetUploadTarget(target);
                  }}
                  className="flex items-center justify-between cursor-pointer px-4 py-2 font-bold mb-2 text-black shadow-sm"
                  style={{ backgroundColor: "var(--navbar-bg)" }}
                >
                  <span className="text-lg">File Upload</span>
                  <span className="text-3xl font-bold leading-none">+</span>
                </label>
                <input
                  id="required-files-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={onPendingFileChange}
                />

                <div className="space-y-1">
                  {pendingUploads.parentBirthCertificate && (
                    <div className="flex justify-between items-center bg-white/70 px-2 py-1 shadow-sm">
                      <span className="text-sm text-black truncate pr-2">{pendingUploads.parentBirthCertificate.name}</span>
                      <button type="button" onClick={() => onRemovePendingFile("parentBirthCertificate")} className="text-[#F87171] hover:text-[#EF4444] shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {pendingUploads.governmentId && (
                    <div className="flex justify-between items-center bg-white/70 px-2 py-1 shadow-sm">
                      <span className="text-sm text-black truncate pr-2">{pendingUploads.governmentId.name}</span>
                      <button type="button" onClick={() => onRemovePendingFile("governmentId")} className="text-[#F87171] hover:text-[#EF4444] shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {pendingUploads.childBirthCertificate && (
                    <div className="flex justify-between items-center bg-white/70 px-2 py-1 shadow-sm">
                      <span className="text-sm text-black truncate pr-2">{pendingUploads.childBirthCertificate.name}</span>
                      <button type="button" onClick={() => onRemovePendingFile("childBirthCertificate")} className="text-[#F87171] hover:text-[#EF4444] shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center mt-12 mb-4">
              {[pendingUploads.parentBirthCertificate, pendingUploads.governmentId, pendingUploads.childBirthCertificate].filter(Boolean).length > 0 && 
               [pendingUploads.parentBirthCertificate, pendingUploads.governmentId, pendingUploads.childBirthCertificate].filter(Boolean).length < 2 && (
                <p className="text-red-600 font-bold mb-4">Error: Please upload at least 2 files.</p>
              )}
              <button
                type="button"
                onClick={() => onSubmit(foundStudent)}
                disabled={!isFormValid || isSubmitting}
                className="px-12 py-3 text-xl font-bold text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--button-green)" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
