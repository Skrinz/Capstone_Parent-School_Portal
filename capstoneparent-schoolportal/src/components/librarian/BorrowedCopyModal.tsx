import React, { useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { libraryApi } from "@/lib/api/libraryApi";
import type {
  BorrowRecord,
  LibraryCategory,
  LibrarySubject,
  MaterialStatus,
} from "@/lib/api/types";
import { formatGradeLevel, GRADE_LEVELS } from "@/lib/libraryHelpers";
import { Loader } from "../ui/Loader";
import BorrowerDetailsModal from "./BorrowerDetailsModal";

const STATUS_FILTER_OPTIONS: Array<{
  value: "All" | MaterialStatus;
  label: string;
}> = [
  { value: "All", label: "All Statuses" },
  { value: "BORROWED", label: "Borrowed" },
  { value: "GIVEN", label: "Given" },
  { value: "LOST", label: "Lost" },
];

const STATUS_STYLES: Record<MaterialStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  BORROWED: "bg-blue-100 text-blue-700",
  GIVEN: "bg-amber-100 text-amber-700",
  LOST: "bg-red-100 text-red-700",
};

const BorrowedCopyModal: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("All");
  const [subjectFilter, setSubjectFilter] = React.useState<string>("All");
  const [gradeFilter, setGradeFilter] = React.useState<string>("All");
  const [statusFilter, setStatusFilter] = React.useState<
    "All" | MaterialStatus
  >("BORROWED");
  const [selectedItem, setSelectedItem] = React.useState<BorrowRecord | null>(
    null,
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<LibraryCategory[]>([]);
  const [subjects, setSubjects] = React.useState<LibrarySubject[]>([]);
  const [borrowHistory, setBorrowHistory] = React.useState<BorrowRecord[]>([]);
  const { showError, showSuccess, clearFeedback } = useApiFeedbackStore();

  const loadBorrowedResources = async () => {
    setLoading(true);
    try {
      const [historyResponse, categoriesResponse, subjectsResponse] = await Promise.all([
        libraryApi.getBorrowHistory({ status: "borrowed", limit: 1000 }),
        libraryApi.getAllCategories(),
        libraryApi.getAllSubjects(),
      ]);
      setBorrowHistory(historyResponse.data);
      setCategories(categoriesResponse.data);
      setSubjects(subjectsResponse.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBorrowedResources();
  }, []);

  const handleStatusChange = async (
    record: BorrowRecord,
    status: MaterialStatus,
  ) => {
    clearFeedback();
    setIsUpdatingStatus(true);

    try {
      const itemName = record.copy?.item?.item_name ?? "Item";

      if (status === "AVAILABLE") {
        await libraryApi.returnMaterial(record.mbr_id, {
          remarks: "Returned via Librarian Dashboard",
        });
        setSelectedItem(null);
      } else {
        await libraryApi.updateCopyStatus(record.copy_id, { status });
        setSelectedItem((current) =>
          current?.mbr_id === record.mbr_id && current.copy
            ? {
                ...current,
                copy: {
                  ...current.copy,
                  status,
                },
              }
            : current,
        );
      }

      showSuccess(`${itemName} is ${status}`);
      await loadBorrowedResources();
    } catch (error) {
      console.error("Failed to update borrower status", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to update borrower status.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredItems = borrowHistory.filter((record) => {
    const itemTitle = record.copy?.item?.item_name || "";
    const recordStatus = record.copy?.status ?? "BORROWED";
    const matchesSearch = itemTitle
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" ||
      record.copy?.item?.category_id?.toString() === categoryFilter;
    const matchesSubject =
      subjectFilter === "All" ||
      record.copy?.item?.subject_id?.toString() === subjectFilter;
    const matchesGrade =
      gradeFilter === "All" ||
      record.copy?.item?.gl_id?.toString() === gradeFilter;
    const matchesStatus =
      statusFilter === "All" || recordStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesSubject && matchesGrade && matchesStatus;
  });
  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    categoryFilter !== "All" ||
    subjectFilter !== "All" ||
    gradeFilter !== "All" ||
    statusFilter !== "BORROWED";

  const getBorrowerName = (record: BorrowRecord) => {
    if (record.student)
      return `${record.student.fname} ${record.student.lname}`;
    if (record.user) return `${record.user.fname} ${record.user.lname}`;
    return "Unknown Borrower";
  };

  const getDateAndTime = (isoString?: string | null) => {
    if (!isoString) return { date: "N/A", time: "N/A" };
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <>
      <div className="mx-auto max-w-280 rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search item"
              className="w-full rounded-md border border-gray-300 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="w-full appearance-none rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
                >
                  <option value="All">All Categories</option>
                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id.toString()}
                    >
                      {category.category_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>

              <div className="relative">
                <select
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value)}
                  className="w-full appearance-none rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
                >
                  <option value="All">All Subjects</option>
                  {subjects.map((subject) => (
                    <option
                      key={subject.subject_id}
                      value={subject.subject_id.toString()}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>

              <div className="relative">
                <select
                  value={gradeFilter}
                  onChange={(event) => setGradeFilter(event.target.value)}
                  className="w-full appearance-none rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
                >
                  <option value="All">All Grade Levels</option>
                  {GRADE_LEVELS.map((grade) => (
                    <option key={grade.id} value={grade.id.toString()}>
                      {grade.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "All" | MaterialStatus,
                    )
                  }
                  className="w-full appearance-none rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-(--button-green)"
                >
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("All");
                  setSubjectFilter("All");
                  setGradeFilter("All");
                  setStatusFilter("BORROWED");
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 sm:shrink-0"
              >
                Clear Filter
              </button>
            ) : null}
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="space-y-3">
              {filteredItems.length === 0 && (
                <div className="rounded-md border border-gray-200 p-6 text-center text-gray-500">
                  No borrowed items found.
                </div>
              )}

              {filteredItems.map((record) => {
                const status = record.copy?.status ?? "BORROWED";
                const isOverdue =
                  status !== "AVAILABLE" &&
                  Boolean(record.due_at) &&
                  new Date(record.due_at) < new Date();

                return (
                  <div
                    key={record.mbr_id}
                    className="rounded-md border border-gray-200 p-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px] sm:items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(record)}
                        className="cursor-pointer text-left"
                      >
                        <h3 className="text-lg font-bold text-gray-900">
                          {record.copy?.item?.item_name} (Copy{" "}
                          {record.copy?.copy_code})
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Borrower:{" "}
                          <span className="font-semibold">
                            {getBorrowerName(record)}
                          </span>
                        </p>
                      </button>

                      <div className="relative flex flex-col items-end">
                        <div
                          className={`mb-2 w-full rounded-full px-4 py-2 text-center text-sm font-bold ${STATUS_STYLES[status]}`}
                        >
                          {status}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void handleStatusChange(record, "AVAILABLE")
                          }
                          className="w-full rounded-full bg-green-500 px-4 py-2 text-center text-sm font-bold text-white hover:bg-green-600"
                        >
                          Mark as Returned
                        </button>
                        {record.due_at && (
                          <p
                            className={`mt-2 text-xs font-semibold ${
                              isOverdue ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            Due: {getDateAndTime(record.due_at).date}{" "}
                            {getDateAndTime(record.due_at).time}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <BorrowerDetailsModal
          onClose={() => setSelectedItem(null)}
          itemName={`${selectedItem.copy?.item?.item_name} (Copy ${selectedItem.copy?.copy_code})`}
          status={selectedItem.copy?.status ?? "BORROWED"}
          onStatusChange={(status) => handleStatusChange(selectedItem, status)}
          isSaving={isUpdatingStatus}
          borrowedDate={getDateAndTime(selectedItem.borrowed_at).date}
          borrowedTime={getDateAndTime(selectedItem.borrowed_at).time}
          dueDate={getDateAndTime(selectedItem.due_at).date}
          dueTime={getDateAndTime(selectedItem.due_at).time}
          borrowerName={getBorrowerName(selectedItem)}
          gradeLevel={
            selectedItem.student
              ? formatGradeLevel(selectedItem.copy?.item?.gl_id || 0)
              : "N/A"
          }
          section="N/A"
        />
      )}
    </>
  );
};

export default BorrowedCopyModal;
