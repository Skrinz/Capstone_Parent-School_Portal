import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  Download,
} from "lucide-react";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { Button } from "../../components/ui/button";
import { StatusDropdown } from "../../components/general/StatusDropdown";
import {
  StudentFormModal,
  type StudentFormData,
} from "../../components/admin/StudentFormModal";
import { StudentBatchUploadModal } from "../../components/admin/StudentBatchUploadModal";
import { ActionConfirmationModal } from "../../components/general/ActionConfirmationModal";
import {
  downloadStudentImportTemplate,
  studentsApi,
  type StudentPayload,
} from "@/lib/api/studentsApi";
import type {
  GradeLevel,
  PaginationMeta,
  StudentRecord,
  StudentStatus,
} from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/authStore";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

type FormErrors = Partial<Record<keyof StudentFormData, string>>;

const ITEMS_PER_PAGE = 10;

const emptyForm = (): StudentFormData => ({
  firstName: "",
  lastName: "",
  sex: "",
  lrn: "",
  gradeLevelId: "",
  status: "",
  schoolYearStart: "",
  schoolYearEnd: "",
});

const formatSchoolYear = (student: StudentRecord) =>
  `${student.syear_start}-${student.syear_end}`;

const formatGradeLevelWithSection = (student: StudentRecord) => {
  const gradeLevel = student.grade_level?.grade_level ?? "Unknown";
  return student.section_name
    ? `${gradeLevel} - ${student.section_name}`
    : gradeLevel;
};

const toApiSex = (sex: "M" | "F") => (sex === "M" ? "Male" : "Female");

const getStatusColor = (status: StudentStatus) => {
  switch (status) {
    case "ENROLLED":
      return "text-(--status-enrolled) bg-green-100";
    case "TRANSFERRED":
      return "text-(--status-transferred) bg-yellow-100";
    case "GRADUATED":
      return "text-(--status-graduated) bg-blue-100";
    case "DROPPED":
      return "text-(--status-dropped) bg-red-100";
    case "SUSPENDED":
      return "text-(--status-suspended) bg-purple-100";
    default:
      return "text-gray-900 bg-gray-100";
  }
};

export const ManageStudents = () => {
  const showError = useApiFeedbackStore((state) => state.showError);
  const role = useAuthStore((state) => state.user?.role);
  const canManageStudents =
    role === "admin" || role === "teacher" || role === "principal";
  const canCreateStudents = canManageStudents;
  const canBatchAddStudents = canManageStudents;

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clearFeedback } = useApiFeedbackStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [gradeLevelFilter, setGradeLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(
    null,
  );
  const requestRef = useRef(0);

  const loadStudents = async (page = currentPage) => {
    const requestId = ++requestRef.current;
    setIsLoading(true);
    clearFeedback();

    try {
      const status =
        statusFilter !== "all" ? (statusFilter as StudentStatus) : undefined;
      const gradeLevelId =
        gradeLevelFilter !== "all" ? Number(gradeLevelFilter) : undefined;

      const response = await studentsApi.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        status,
        grade_level: gradeLevelId,
        search: debouncedSearchQuery || undefined,
      });

      if (requestId !== requestRef.current) return;

      setStudents(response.data);
      setPagination(response.pagination);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      showError(
        err instanceof Error ? err.message : "Failed to fetch students",
      );
    } finally {
      if (requestId === requestRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [gradeLevelsResponse] = await Promise.all([
          studentsApi.getGradeLevels(),
        ]);
        setGradeLevels(gradeLevelsResponse.data);
      } catch (err) {
        showError(
          err instanceof Error
            ? err.message
            : "Failed to fetch student form options",
        );
      }
    };

    loadPageData();
  }, []);

  useEffect(() => {
    loadStudents(currentPage);
  }, [currentPage, gradeLevelFilter, statusFilter, debouncedSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [gradeLevelFilter, statusFilter, debouncedSearchQuery]);

  const resetForm = () => {
    setFormData(emptyForm());
    setFormErrors({});
  };

  const openAddModal = () => {
    setEditingStudent(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const validateForm = (): FormErrors | null => {
    const errors: FormErrors = {};

    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.sex) errors.sex = "Sex is required";

    if (!formData.lrn.trim()) {
      errors.lrn = "LRN is required";
    } else if (!/^\d{12}$/.test(formData.lrn)) {
      errors.lrn = "LRN must be exactly 12 digits";
    }

    if (!formData.gradeLevelId) errors.gradeLevelId = "Grade level is required";
    if (!formData.status) errors.status = "Status is required";

    if (!formData.schoolYearStart) {
      errors.schoolYearStart = "Required";
    }
    if (!formData.schoolYearEnd) {
      errors.schoolYearEnd = "Required";
    }

    if (formData.schoolYearStart && formData.schoolYearEnd) {
      const yearStart = Number(formData.schoolYearStart);
      const yearEnd = Number(formData.schoolYearEnd);

      if (Number.isNaN(yearStart)) {
        errors.schoolYearStart = "Invalid year";
      }
      if (Number.isNaN(yearEnd)) {
        errors.schoolYearEnd = "Invalid year";
      }

      if (
        !Number.isNaN(yearStart) &&
        !Number.isNaN(yearEnd) &&
        yearEnd < yearStart
      ) {
        errors.schoolYearEnd = "End year must be >= start year";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  const toPayload = (): StudentPayload => ({
    fname: formData.firstName.trim(),
    lname: formData.lastName.trim(),
    sex: toApiSex(formData.sex as "M" | "F"),
    lrn_number: formData.lrn.trim(),
    gl_id: Number(formData.gradeLevelId),
    syear_start: Number(formData.schoolYearStart),
    syear_end: Number(formData.schoolYearEnd),
    status: formData.status as StudentStatus,
  });

  const handleAddStudent = () => {
    const errors = validateForm();
    if (errors) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsAddConfirmOpen(true);
  };

  const handleAddStudentConfirm = async () => {
    setIsAddConfirmOpen(false);
    setIsSubmitting(true);
    try {
      await studentsApi.create(toPayload());
      setIsAddModalOpen(false);
      resetForm();
      await loadStudents(currentPage);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (student: StudentRecord) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.fname,
      lastName: student.lname,
      sex: student.sex,
      lrn: student.lrn_number,
      gradeLevelId: String(student.gl_id),
      status: student.status,
      schoolYearStart: String(student.syear_start),
      schoolYearEnd: String(student.syear_end),
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = () => {
    if (!editingStudent) return;

    const errors = validateForm();
    if (errors) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsEditConfirmOpen(true);
  };

  const handleUpdateStudentConfirm = async () => {
    setIsEditConfirmOpen(false);
    setIsSubmitting(true);
    try {
      await studentsApi.update(editingStudent!.student_id, toPayload());
      setIsEditModalOpen(false);
      setEditingStudent(null);
      resetForm();
      await loadStudents(currentPage);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchUpload = async (file: File) => {
    setIsSubmitting(true);
    try {
      const response = await studentsApi.import(file);
      await loadStudents(1);
      setCurrentPage(1);
      return response;
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("Failed to upload student CSV");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadStudentImportTemplate();
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Failed to download student import template",
      );
    }
  };

  const totalPages = pagination.totalPages;
  const showingStart =
    students.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingEnd =
    students.length === 0
      ? 0
      : Math.min(
          (pagination.page - 1) * pagination.limit + students.length,
          pagination.total,
        );
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    debouncedSearchQuery.trim() !== "" ||
    gradeLevelFilter !== "all" ||
    statusFilter !== "all";

  return (
    <div className="min-h-screen">
      <RoleAwareNavbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manage Students</h1>
              {!canManageStudents && (
                <p className="mt-2 text-sm text-gray-500">
                  Student records are managed here through updates to student
                  details and status.
                </p>
              )}
            </div>
            {canManageStudents && (
              <div className="flex flex-col gap-3 sm:flex-row">
                {canBatchAddStudents && (
                  <>
                    <Button
                      className="bg-(--navbar-bg) px-6 py-2 text-black hover:bg-yellow-300"
                      onClick={handleDownloadTemplate}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download XLSX Template
                    </Button>
                    <Button
                      className="bg-(--button-green) px-6 py-2 text-white hover:bg-(--button-hover-green)"
                      onClick={() => setIsBatchModalOpen(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Batch Add Students
                    </Button>
                  </>
                )}
                {canCreateStudents && (
                  <Button
                    className="bg-(--button-green) px-6 py-2 text-white hover:bg-(--button-hover-green)"
                    onClick={openAddModal}
                  >
                    Add New Student
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="mb-6 flex flex-col gap-4 lg:flex-row">
            <input
              type="text"
              placeholder="Search student name or LRN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <StatusDropdown
              value={gradeLevelFilter}
              onChange={setGradeLevelFilter}
              placeholder="Grade Level"
              options={[
                { value: "all", label: "Grade Level" },
                ...gradeLevels.map((gradeLevel) => ({
                  value: String(gradeLevel.gl_id),
                  label: gradeLevel.grade_level,
                })),
              ]}
            />
            <StatusDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Status"
              options={[
                { value: "all", label: "Status" },
                {
                  value: "ENROLLED",
                  label: "Enrolled",
                  className: "text-(--status-enrolled)",
                },
                {
                  value: "TRANSFERRED",
                  label: "Transferred",
                  className: "text-(--status-transferred)",
                },
                {
                  value: "GRADUATED",
                  label: "Graduated",
                  className: "text-(--status-graduated)",
                },
                {
                  value: "DROPPED",
                  label: "Dropped",
                  className: "text-(--status-dropped)",
                },
                {
                  value: "SUSPENDED",
                  label: "Suspended",
                  className: "text-(--status-suspended)",
                },
              ]}
            />
            {hasActiveFilters ? (
              <Button
                type="button"
                className="bg-(--status-inactive) text-white hover:brightness-110"
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                  setGradeLevelFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-(--button-green)" />
              <p>Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-gray-500">
              No students found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Student Name
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      LRN
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Grade - Section
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      School Year
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.student_id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        {student.fname} {student.lname}
                      </td>
                      <td className="px-6 py-4">{student.lrn_number}</td>
                      <td className="px-6 py-4">
                        {formatGradeLevelWithSection(student)}
                      </td>
                      <td className="px-6 py-4">{formatSchoolYear(student)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(
                            student.status,
                          )}`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditClick(student)}
                            className="text-(--button-green) transition-colors hover:text-(--button-hover-green)"
                            aria-label="Edit student"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {showingStart}-{showingEnd} of {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`rounded border px-3 py-1 ${
                      currentPage === pageNum
                        ? "border-(--button-green) bg-(--button-green) text-white"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1))
                }
                disabled={
                  currentPage === totalPages || totalPages === 0 || isLoading
                }
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <StudentFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        onSubmit={handleAddStudent}
        title="Add Student"
        submitLabel="Add"
        formData={formData}
        setFormData={setFormData}
        gradeLevels={gradeLevels}
        isSubmitting={isSubmitting}
        errors={formErrors}
      />

      <StudentFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
          resetForm();
        }}
        onSubmit={handleUpdateStudent}
        title="Edit Student"
        submitLabel="Update"
        formData={formData}
        setFormData={setFormData}
        gradeLevels={gradeLevels}
        isSubmitting={isSubmitting}
        errors={formErrors}
      />

      <StudentBatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onUpload={handleBatchUpload}
        isUploading={isSubmitting}
      />

      <ActionConfirmationModal
        isOpen={isAddConfirmOpen}
        onClose={() => setIsAddConfirmOpen(false)}
        onConfirm={handleAddStudentConfirm}
        title="Confirm Add Student"
        message={`Are you sure you want to add ${formData.firstName} ${formData.lastName} to the database?`}
        confirmLabel="Add Student"
        isLoading={isSubmitting}
      />

      <ActionConfirmationModal
        isOpen={isEditConfirmOpen}
        onClose={() => setIsEditConfirmOpen(false)}
        onConfirm={handleUpdateStudentConfirm}
        title="Confirm Update Student"
        message={`Are you sure you want to save changes for ${formData.firstName} ${formData.lastName}?`}
        confirmLabel="Update Student"
        isLoading={isSubmitting}
      />
    </div>
  );
};
