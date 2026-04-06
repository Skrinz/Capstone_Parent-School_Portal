import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
} from "lucide-react";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { Button } from "../../components/ui/button";
import { StatusDropdown } from "../../components/general/StatusDropdown";
import {
  StudentFormModal,
  type StudentFormData,
} from "../../components/admin/StudentFormModal";
import { StudentBatchUploadModal } from "../../components/admin/StudentBatchUploadModal";
import { studentsApi, type StudentPayload } from "@/lib/api/studentsApi";
import type {
  GradeLevel,
  PaginationMeta,
  StudentRecord,
  StudentStatus,
} from "@/lib/api/types";
import { useAuthStore } from "@/lib/store/authStore";

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
  const role = useAuthStore((state) => state.user?.role);
  const canManageStudents =
    role === "admin" ||
    role === "teacher" ||
    role === "principal" ||
    role === "vice_principal";
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
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [gradeLevelFilter, setGradeLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>(emptyForm);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);

  const loadStudents = async (page = currentPage) => {
    setIsLoading(true);
    setError(null);

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
      });

      setStudents(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch students",
      );
    } finally {
      setIsLoading(false);
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
        setError(
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
  }, [currentPage, gradeLevelFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [gradeLevelFilter, statusFilter]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) return students;

    return students.filter((student) => {
      const fullName = `${student.fname} ${student.lname}`.toLowerCase();
      return (
        fullName.includes(normalizedQuery) ||
        student.lrn_number.includes(searchQuery)
      );
    });
  }, [students, searchQuery]);

  const resetForm = () => setFormData(emptyForm());

  const openAddModal = () => {
    setEditingStudent(null);
    resetForm();
    setIsAddModalOpen(true);
  };

  const validateForm = () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.sex ||
      !formData.lrn.trim() ||
      !formData.gradeLevelId ||
      !formData.status ||
      !formData.schoolYearStart ||
      !formData.schoolYearEnd
    ) {
      return "Please complete all required fields.";
    }

    if (!/^\d{12}$/.test(formData.lrn)) {
      return "LRN must be exactly 12 digits.";
    }

    const schoolYearStart = Number(formData.schoolYearStart);
    const schoolYearEnd = Number(formData.schoolYearEnd);

    if (Number.isNaN(schoolYearStart) || Number.isNaN(schoolYearEnd)) {
      return "School year must be a valid number.";
    }

    if (schoolYearEnd < schoolYearStart) {
      return "School year end must be greater than or equal to the start year.";
    }

    return null;
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

  const handleAddStudent = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await studentsApi.create(toPayload());
      setIsAddModalOpen(false);
      resetForm();
      await loadStudents(currentPage);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add student");
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

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await studentsApi.update(editingStudent.student_id, toPayload());
      setIsEditModalOpen(false);
      setEditingStudent(null);
      resetForm();
      await loadStudents(currentPage);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchUpload = async (file: File) => {
    setIsSubmitting(true);
    try {
      await studentsApi.import(file);
      setIsBatchModalOpen(false);
      await loadStudents(1);
      setCurrentPage(1);
      alert("Student CSV uploaded successfully.");
    } catch (err) {
      throw (err instanceof Error
        ? err
        : new Error("Failed to upload student CSV"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = pagination.totalPages;
  const showingStart =
    filteredStudents.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingEnd =
    filteredStudents.length === 0
      ? 0
      : Math.min(
          (pagination.page - 1) * pagination.limit + filteredStudents.length,
          pagination.total,
        );

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
                  <Button
                    className="bg-white px-6 py-2 text-(--button-green) ring-1 ring-(--button-green) hover:bg-green-50"
                    onClick={() => setIsBatchModalOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Batch Add Students
                  </Button>
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
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-(--button-green)" />
              <p>Loading students...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={() => loadStudents(currentPage)}
                className="mt-2 text-sm font-semibold underline hover:text-red-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredStudents.length === 0 ? (
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
                      Grade Level
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
                  {filteredStudents.map((student) => (
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
                disabled={currentPage === totalPages || totalPages === 0 || isLoading}
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
      />

      <StudentBatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onUpload={handleBatchUpload}
        isUploading={isSubmitting}
      />
    </div>
  );
};
