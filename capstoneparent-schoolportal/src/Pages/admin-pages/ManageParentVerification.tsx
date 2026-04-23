import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCw } from "lucide-react";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { StatusDropdown } from "../../components/general/StatusDropdown";
import {
  ParentsVerificationModal,
  type ParentVerificationRecord,
} from "@/components/admin/ParentsVerificationModal";
import {
  parentsApi,
  normalizeRegistration,
  type ParentRegistrationStatus,
} from "@/lib/api/parentsApi";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

type VerificationStatus = ParentVerificationRecord["status"];

const isVerificationStatus = (
  value: ParentRegistrationStatus | "all",
): value is VerificationStatus => value !== "all";

export const ManageParentVerification = () => {
  const [verifications, setVerifications] = useState<ParentVerificationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ParentRegistrationStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedVerificationId, setSelectedVerificationId] = useState<number | null>(null);
  const [modalRemarks, setModalRemarks] = useState("");
  const [submittingState, setSubmittingState] = useState<"approving" | "denying" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError, clearFeedback } = useApiFeedbackStore();

  const selectedVerification = useMemo(
    () =>
      verifications.find((verification) => verification.id === selectedVerificationId) ??
      null,
    [selectedVerificationId, verifications],
  );

  const formatDate = (value: string) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(parsedDate);
  };

  const loadRegistrations = useCallback(async (silent = false) => {
    setIsLoading(true);
    if (!silent) clearFeedback();

    try {
      const response = await parentsApi.getRegistrations(statusFilter);
      setVerifications(response.data.map(normalizeRegistration));
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to load parent registrations",
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, clearFeedback, showError]);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    if (selectedVerificationId !== null && !selectedVerification) {
      setSelectedVerificationId(null);
      setModalRemarks("");
    }
  }, [selectedVerification, selectedVerificationId]);

  const filteredVerifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const fromDateMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toDateMs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    let filtered = verifications.filter((verification) => {
      if (!query) return true;

      return [
        verification.parentName,
        verification.contactNumber,
        verification.address,
        verification.studentNames.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    if (fromDateMs !== null || toDateMs !== null) {
      filtered = filtered.filter((verification) => {
        const submittedAt = new Date(verification.submittedAt).getTime();
        if (Number.isNaN(submittedAt)) return false;
        if (fromDateMs !== null && submittedAt < fromDateMs) return false;
        if (toDateMs !== null && submittedAt > toDateMs) return false;
        return true;
      });
    }

    return filtered;
  }, [verifications, searchQuery, fromDate, toDate]);

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case "PENDING":
        return "text-(--status-pending)";
      case "DENIED":
        return "text-(--status-denied)";
      case "VERIFIED":
        return "text-(--status-verified)";
      default:
        return "text-gray-900";
    }
  };

  const openVerification = (verification: ParentVerificationRecord) => {
    setSelectedVerificationId(verification.id);
    setModalRemarks(verification.remarks ?? "");
  };

  const closeVerification = () => {
    setSelectedVerificationId(null);
    setModalRemarks("");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  const updateVerification = async (nextStatus: "VERIFIED" | "DENIED") => {
    if (!selectedVerification) return;
    if (nextStatus === "DENIED" && !modalRemarks.trim()) {
      showError("Remarks are required when denying registration");
      return;
    }

    setSubmittingState(nextStatus === "VERIFIED" ? "approving" : "denying");
    try {
      await parentsApi.verifyRegistration(
        selectedVerification.id,
        { status: nextStatus, remarks: modalRemarks.trim() || undefined },
        { skipSuccessFeedback: true },
      );
      // Reload silently so the success toast is not cleared
      await loadRegistrations(true);
      closeVerification();
      if (nextStatus === "VERIFIED") {
        showSuccess("Registration approved. A confirmation email has been sent to the parent.");
      } else {
        showSuccess("Registration denied successfully.");
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to update verification",
      );
    } finally {
      setSubmittingState(null);
    }
  };

  return (
    <div className="min-h-screen">
      <RoleAwareNavbar />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Manage Parent Verification</h1>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <StatusDropdown
                value={isVerificationStatus(statusFilter) ? statusFilter : "all"}
                onChange={(value) =>
                  setStatusFilter(value === "all" ? "all" : (value as ParentRegistrationStatus))
                }
                options={[
                  { value: "all", label: "Status" },
                  {
                    value: "PENDING",
                    label: "Pending",
                    className: "text-(--status-pending)",
                  },
                  {
                    value: "DENIED",
                    label: "Denied",
                    className: "text-(--status-denied)",
                  },
                  {
                    value: "VERIFIED",
                    label: "Verified",
                    className: "text-(--status-verified)",
                  },
                ]}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">From</span>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="min-w-36 bg-transparent text-sm text-gray-900 focus:outline-none [color-scheme:light]"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">To</span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                    className="min-w-36 bg-transparent text-sm text-gray-900 focus:outline-none [color-scheme:light]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void loadRegistrations()}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 flex items-center gap-2"
                  disabled={isLoading}
                >
                  <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-md border border-red-300 bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                  >
                    Clear Filter
                  </button>
                ) : null}
              </div>
            </div>
          </div>



          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Parent Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Date Submitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      Loading parent registrations...
                    </td>
                  </tr>
                ) : filteredVerifications.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No verifications found
                    </td>
                  </tr>
                ) : (
                  filteredVerifications.map((verification) => (
                    <tr
                      key={verification.id}
                      className="cursor-pointer border-b border-gray-200 hover:bg-gray-50"
                      onClick={() => openVerification(verification)}
                    >
                      <td className="px-6 py-4">{verification.parentName}</td>
                      <td className={`px-6 py-4 font-bold ${getStatusColor(verification.status)}`}>
                        {verification.status === "PENDING"
                          ? "Pending Verification"
                          : verification.status}
                      </td>
                      <td className="px-6 py-4">{formatDate(verification.submittedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ParentsVerificationModal
        isOpen={Boolean(selectedVerification)}
        verification={selectedVerification}
        remarks={modalRemarks}
        submittingState={submittingState}
        onRemarksChange={setModalRemarks}
        onApprove={() => void updateVerification("VERIFIED")}
        onDeny={() => void updateVerification("DENIED")}
        onClose={closeVerification}
      />
    </div>
  );
};
