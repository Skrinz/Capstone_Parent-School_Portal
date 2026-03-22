import { useRef, useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Plus, Search, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi, studentsApi, type StudentSearchResult } from "@/lib/api";
import { setDeviceToken } from "@/lib/auth";

type RegistrationStep = "form" | "otp" | "complete";

const FILE_INPUT_ID = "register-file-upload";

interface SelectedStudent {
  student_id: number;
  lrn_number: string;
  fname: string;
  lname: string;
  grade_level: string;
}

interface StudentRow {
  rowId: number;
  query: string;
  results: StudentSearchResult[];
  isSearching: boolean;
  showDropdown: boolean;
}

const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) {
    return local[0] + "*".repeat(local.length - 1) + "@" + domain;
  }
  return local.slice(0, 2) + "*".repeat(local.length - 2) + "@" + domain;
};
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim().length > 0)
    return error.message;
  return fallback;
};

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

export const RegisterCard = () => {
  const navigate = useNavigate();
  const nextRowId = useRef(2);
  const nextFileId = useRef(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    contact: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>(
    [],
  );
  const [studentRows, setStudentRows] = useState<StudentRow[]>([
    {
      rowId: 1,
      query: "",
      results: [],
      isSearching: false,
      showDropdown: false,
    },
  ]);
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: number; file: File }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<RegistrationStep>("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // ─── LRN search ─────────────────────────────────────────────────────────────

  const doSearch = useCallback(async (rowId: number, lrn: string) => {
    if (!lrn) {
      setStudentRows((prev) =>
        prev.map((r) =>
          r.rowId === rowId
            ? { ...r, results: [], isSearching: false, showDropdown: false }
            : r,
        ),
      );
      return;
    }
    setStudentRows((prev) =>
      prev.map((r) =>
        r.rowId === rowId
          ? { ...r, isSearching: true, showDropdown: false }
          : r,
      ),
    );
    try {
      const json = await studentsApi.searchByLrn(lrn);
      setStudentRows((prev) =>
        prev.map((r) =>
          r.rowId === rowId
            ? {
                ...r,
                results: json.data,
                isSearching: false,
                showDropdown: true,
              }
            : r,
        ),
      );
    } catch {
      setStudentRows((prev) =>
        prev.map((r) =>
          r.rowId === rowId
            ? { ...r, results: [], isSearching: false, showDropdown: true }
            : r,
        ),
      );
    }
  }, []);

  const debouncedSearch = useDebouncedCallback(doSearch, 300);

  const handleLrnInput = (rowId: number, raw: string) => {
    const value = raw.replace(/\D/g, "");
    setStudentRows((prev) =>
      prev.map((r) =>
        r.rowId === rowId ? { ...r, query: value, showDropdown: false } : r,
      ),
    );
    if (value) debouncedSearch(rowId, value);
    else {
      setStudentRows((prev) =>
        prev.map((r) =>
          r.rowId === rowId ? { ...r, results: [], showDropdown: false } : r,
        ),
      );
    }
  };

  const handleLrnKeyDown = (
    rowId: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const row = studentRows.find((r) => r.rowId === rowId);
      if (row?.query) doSearch(rowId, row.query);
    }
  };

  const handleSelectStudent = (rowId: number, student: StudentSearchResult) => {
    if (selectedStudents.some((s) => s.student_id === student.student_id))
      return;
    setSelectedStudents((prev) => [
      ...prev,
      {
        student_id: student.student_id,
        lrn_number: student.lrn_number,
        fname: student.fname,
        lname: student.lname,
        grade_level: student.grade_level.grade_level,
      },
    ]);
    setStudentRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const removeSelectedStudent = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.filter((s) => s.student_id !== studentId),
    );
  };

  const addStudentRow = () => {
    const id = nextRowId.current++;
    setStudentRows((prev) => [
      ...prev,
      {
        rowId: id,
        query: "",
        results: [],
        isSearching: false,
        showDropdown: false,
      },
    ]);
  };

  const removeStudentRow = (rowId: number) => {
    setStudentRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  useEffect(() => {
    const close = () =>
      setStudentRows((prev) =>
        prev.map((r) => ({ ...r, showDropdown: false })),
      );
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // ─── File handling ───────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: nextFileId.current++,
        file,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) =>
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
        id: nextFileId.current++,
        file,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleInputChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const todayISO = new Date().toISOString().split("T")[0];

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    if (!formData.dateOfBirth) {
      setErrorMessage("Please enter your date of birth");
      return;
    }
    if (selectedStudents.length === 0) {
      setErrorMessage("Please select at least one student");
      return;
    }
    if (uploadedFiles.length === 0) {
      setErrorMessage("Please upload at least one supporting document");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("fname", formData.firstName.trim());
      payload.append("lname", formData.lastName.trim());
      payload.append("date_of_birth", formData.dateOfBirth);
      payload.append("contact_num", formData.contact.trim());
      payload.append("address", formData.address.trim());
      payload.append("email", formData.email.trim());
      payload.append("password", formData.password);
      payload.append("role", "Parent");
      for (const s of selectedStudents)
        payload.append("student_ids", String(s.student_id));
      for (const f of uploadedFiles) payload.append("attachments", f.file);

      const result = await authApi.register(payload);
      setPendingEmail(formData.email.trim().toLowerCase());
      setStep("otp");
      setOtpCode("");
      setInfoMessage(
        result.message || "OTP sent to your email. Enter it below to continue.",
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Unable to submit registration right now"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    if (otpCode.length !== 6) {
      setErrorMessage("OTP code must be exactly 6 digits");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const otpResult = await authApi.verifyRegistrationOtp(
        pendingEmail,
        otpCode,
      );
      if (otpResult.data?.deviceToken)
        setDeviceToken(otpResult.data.deviceToken);
      setStep("complete");
      setInfoMessage(otpResult.message || "Email verified successfully");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to verify OTP"));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mt-20">
      <div className="bg-[#f9f6c8] rounded-3xl p-8 pt-10 mx-auto max-w-7xl">
        {errorMessage && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        )}
        {infoMessage && (
          <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {infoMessage}
          </p>
        )}

        {/* ── FORM STEP ── */}
        {step === "form" && (
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8">
              {/* Left — Parent Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative h-20 w-20 shrink-0">
                    <img
                      src="/Logo.png"
                      alt="School Logo"
                      className="object-contain h-full w-full"
                    />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Register as a Parent
                  </h1>
                </div>

                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                  />
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                  />

                  {/*
                    ── Date of Birth ──────────────────────────────────────────
                    Root cause of the overlap: type="date" renders its own
                    "mm/dd/yyyy" text that floats on top of any CSS-positioned
                    label inside the same box.

                    Fix: wrap both the static label text AND the bare <input>
                    inside a <label> element styled as the pill. The label
                    sits on the left as plain inline text; the date input fills
                    the remaining space. They never overlap because they are
                    separate inline siblings, not stacked via position:absolute.
                  */}
                  <label
                    htmlFor="dob-input"
                    className="flex h-14 w-full items-center rounded-full border-2 border-gray-900 bg-white px-6 gap-3 cursor-pointer"
                  >
                    <span className="shrink-0 text-lg text-gray-500 whitespace-nowrap">
                      Date of Birth
                    </span>
                    {/* Vertical separator — matches the pill border colour */}
                    <span className="h-6 w-px bg-gray-300 shrink-0" />
                    <input
                      id="dob-input"
                      type="date"
                      max={todayISO}
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className="flex-1 min-w-0 bg-transparent text-lg text-gray-900 focus:outline-none [color-scheme:light]"
                    />
                  </label>

                  <Input
                    type="tel"
                    placeholder="Contact Number"
                    value={formData.contact}
                    onChange={(e) =>
                      handleInputChange("contact", e.target.value)
                    }
                    className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                  />
                  <Input
                    type="text"
                    placeholder="Address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-lg placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px bg-gray-900" />

              {/* Right — Children Information */}
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                  Children
                </h2>

                <div className="space-y-3 mb-8">
                  <p className="text-red-700 italic font-semibold text-base">
                    Registration Requirements:
                  </p>
                  <ul className="space-y-2 text-red-700 font-bold text-base list-disc list-inside">
                    <li>
                      <span className="italic">Parent's Birth Certificate</span>
                    </li>
                    <li>
                      <span className="italic">Government-issued ID</span>{" "}
                      <span className="italic font-normal">
                        if Parent's Birth Certificate is not available.
                      </span>
                    </li>
                    <li>
                      <span className="italic">Child's Birth Certificate</span>
                    </li>
                  </ul>
                </div>

                {selectedStudents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      Selected Students
                    </p>
                    {selectedStudents.map((s) => (
                      <div
                        key={s.student_id}
                        className="flex items-center justify-between gap-3 rounded-xl border-2 border-green-400 bg-green-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {s.fname} {s.lname}
                            </p>
                            <p className="text-xs text-gray-500">
                              LRN: {s.lrn_number} · {s.grade_level}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedStudent(s.student_id)}
                          className="shrink-0 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {studentRows.map((row) => (
                    <div key={row.rowId} className="relative">
                      <div className="flex gap-2">
                        <div
                          className="relative flex-1"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="Type LRN then press Enter to search"
                            value={row.query}
                            onChange={(e) =>
                              handleLrnInput(row.rowId, e.target.value)
                            }
                            onKeyDown={(e) => handleLrnKeyDown(row.rowId, e)}
                            onFocus={() => {
                              if (row.results.length > 0)
                                setStudentRows((prev) =>
                                  prev.map((r) =>
                                    r.rowId === row.rowId
                                      ? { ...r, showDropdown: true }
                                      : r,
                                  ),
                                );
                            }}
                            className="h-14 rounded-full border-2 border-gray-900 bg-white pl-12 pr-6 text-lg placeholder:text-gray-500"
                          />
                          {row.isSearching && (
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse select-none">
                              Searching…
                            </span>
                          )}
                        </div>

                        {(studentRows.length > 1 ||
                          selectedStudents.length > 0) && (
                          <Button
                            type="button"
                            onClick={() => removeStudentRow(row.rowId)}
                            className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        )}
                      </div>

                      {row.showDropdown && (
                        <div
                          className="absolute z-30 mt-1 w-full rounded-2xl border-2 border-gray-200 bg-white shadow-xl overflow-hidden"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {row.results.length > 0 ? (
                            row.results.map((student) => {
                              const alreadySelected = selectedStudents.some(
                                (s) => s.student_id === student.student_id,
                              );
                              return (
                                <button
                                  key={student.student_id}
                                  type="button"
                                  disabled={alreadySelected}
                                  onClick={() =>
                                    handleSelectStudent(row.rowId, student)
                                  }
                                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                                    alreadySelected
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
                                  {alreadySelected && (
                                    <span className="text-xs text-gray-400 italic">
                                      Already added
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <p className="px-5 py-4 text-sm text-gray-500">
                              No enrolled students found with LRN starting with
                              "{row.query}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={addStudentRow}
                  className="w-full h-12 rounded-lg bg-[#52a86a] hover:bg-[#449558] text-white font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Add another student <Plus className="h-5 w-5" />
                </Button>

                <div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id={FILE_INPUT_ID}
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      document.getElementById(FILE_INPUT_ID)?.click()
                    }
                    className="w-full h-12 rounded-lg bg-[#c4d433] hover:bg-[#b0c020] text-gray-900 font-semibold text-lg flex items-center justify-center gap-2"
                  >
                    File Upload <Plus className="h-5 w-5" />
                  </Button>
                </div>

                <div
                  className={`border-4 border-dashed ${isDragging ? "border-green-600 bg-green-50" : "border-gray-400"} rounded-2xl p-8 text-center bg-white transition-colors cursor-pointer hover:border-green-500 hover:bg-green-50`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById(FILE_INPUT_ID)?.click()
                  }
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-600" />
                    <p className="text-xl font-medium text-gray-800">
                      Drag & Drop or Click to Upload Files
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {uploadedFiles.map((fileObj, index) => (
                    <div
                      key={fileObj.id}
                      className="flex items-center justify-between bg-white border-2 border-gray-300 rounded-xl px-6 py-3"
                    >
                      <span className="text-lg truncate pr-4">
                        {fileObj.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="shrink-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    disabled={isSubmitting}
                    className="h-14 px-12 bg-[#4a9d5f] hover:bg-[#3d8550] text-white rounded-full text-xl font-semibold disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting…" : "Submit Registration"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── OTP STEP ── */}
        {step === "otp" && (
          <form
            onSubmit={handleVerifyOtp}
            className="mx-auto max-w-xl rounded-2xl bg-white p-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              Verify Email OTP
            </h2>
            <p className="mt-4 text-center text-gray-700">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold">{maskEmail(pendingEmail)}</span>.
            </p>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="6-digit OTP"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="mt-6 h-14 rounded-full border-2 border-gray-900 bg-white px-6 text-center text-2xl tracking-[0.4em] placeholder:tracking-normal"
            />
            <div className="mt-8 flex justify-center gap-4">
              <Button
                type="button"
                className="h-12 rounded-full bg-gray-500 px-8 text-white hover:bg-gray-600"
                onClick={() => {
                  setStep("form");
                  setOtpCode("");
                  setErrorMessage("");
                  setInfoMessage("");
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isVerifyingOtp}
                className="h-12 rounded-full bg-[#4a9d5f] px-10 text-white hover:bg-[#3d8550] disabled:opacity-60"
              >
                {isVerifyingOtp ? "Verifying…" : "Verify OTP"}
              </Button>
            </div>
          </form>
        )}

        {/* ── COMPLETE STEP ── */}
        {step === "complete" && (
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Registration Complete
            </h2>
            <p className="mt-4 text-gray-700">
              Your email has been verified. Your parent account is now pending
              activation by an administrator.
            </p>
            <Button
              type="button"
              className="mt-8 h-12 rounded-full bg-[#4a9d5f] px-10 text-white hover:bg-[#3d8550]"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
