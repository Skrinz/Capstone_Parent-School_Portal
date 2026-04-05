import { useMemo, useState } from "react";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { StatusDropdown } from "../../components/general/StatusDropdown";
import {
  ParentsVerificationModal,
  type ParentVerificationRecord,
} from "@/components/admin/ParentsVerificationModal";

type VerificationStatus = ParentVerificationRecord["status"];

export const ManageParentVerification = () => {
  const [verifications, setVerifications] = useState<ParentVerificationRecord[]>([
    {
      id: 1,
      parentName: "Jane Doe",
      contactNumber: "09687831826",
      address: "123 Mabolo Street, Barangay Banilad, Mandaue City, Cebu 6014, Philippines",
      studentNames: [
        "Lorenzo Castillo (501142400724)",
        "Sophia Dizon (501142400725)",
        "Ethan Navarro (501142400722)",
      ],
      status: "PENDING",
      submittedAt: "03/12/2025",
      remarks: "Waiting for registrar review.",
      uploadedFiles: [
        { name: "Parent Birth Certificate.pdf", filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
        { name: "Lorenzo Castillo.pdf", filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
        { name: "Sophia Dizon.pdf", filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
        { name: "Ethan Navarro.pdf", filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
      ],
    },
    {
      id: 2,
      parentName: "John Bramble",
      contactNumber: "09171234567",
      address: "78 Acacia Road, Poblacion, Cebu City, Cebu",
      studentNames: ["Mika Bramble (501142400726)"],
      status: "DENIED",
      submittedAt: "03/12/2025",
      remarks: "Please upload a clearer copy of the parent birth certificate.",
      uploadedFiles: [
        { name: "Parent Birth Certificate.pdf", filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
        { name: "Child Birth Certificate.pdf", filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
      ],
    },
    {
      id: 3,
      parentName: "Jina Ling",
      contactNumber: "09221234567",
      address: "14 Mango Avenue, Guadalupe, Cebu City, Cebu",
      studentNames: ["Aiden Ling (501142400727)"],
      status: "VERIFIED",
      submittedAt: "03/07/2025",
      remarks: "Verified and ready for parent account access.",
      uploadedFiles: [
        { name: "Government-issued ID.pdf", filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
        { name: "Child Birth Certificate.pdf", filePath: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" },
      ],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateSort, setDateSort] = useState<"asc" | "desc" | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<ParentVerificationRecord | null>(null);
  const [modalRemarks, setModalRemarks] = useState("");

  const formatDate = (value: string) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).format(parsedDate);
  };

  // Filtered and sorted verifications
  const filteredVerifications = useMemo(() => {
    let filtered = verifications.filter((verification) =>
      verification.parentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    // Sort by date if applicable
    if (dateSort) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.submittedAt);
        const dateB = new Date(b.submittedAt);
        return dateSort === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
    }

    return filtered;
  }, [verifications, searchQuery, statusFilter, dateSort]);

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
    setSelectedVerification(verification);
    setModalRemarks(verification.remarks ?? "");
  };

  const closeVerification = () => {
    setSelectedVerification(null);
    setModalRemarks("");
  };

  const updateVerification = (nextStatus: VerificationStatus) => {
    if (!selectedVerification) return;

    setVerifications((current) =>
      current.map((verification) =>
        verification.id === selectedVerification.id
          ? { ...verification, status: nextStatus, remarks: modalRemarks }
          : verification
      )
    );
    closeVerification();
  };

  return (
    <div className="min-h-screen">
      <RoleAwareNavbar />
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Manage Parent Verification</h1>
            <div className="flex gap-4 items-center">
              <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
              <StatusDropdown
                value={statusFilter}
                onChange={setStatusFilter}
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
              <button
              onClick={() => setDateSort(dateSort === "asc" ? "desc" : "asc")}
              className="bg-(--button-green) text-white font-semibold px-6 py-2 rounded-md hover:bg-(--button-hover-green) transition-colors"
            >
              Date
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Parent Name
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">
                    Date Submitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVerifications.length === 0 ? (
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
                      <td className="py-4 px-6">{verification.parentName}</td>
                      <td className={`py-4 px-6 font-bold ${getStatusColor(verification.status)}`}>
                        {verification.status === "PENDING" ? "Pending Verification" : verification.status}
                      </td>
                      <td className="py-4 px-6">{formatDate(verification.submittedAt)}</td>
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
        onRemarksChange={setModalRemarks}
        onApprove={() => updateVerification("VERIFIED")}
        onDeny={() => updateVerification("DENIED")}
        onClose={closeVerification}
      />
    </div>
  );
};