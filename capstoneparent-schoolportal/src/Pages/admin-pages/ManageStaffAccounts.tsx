import { useState, useMemo, useCallback, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { NavbarAdmin } from "../../components/admin/NavbarAdmin";
import { Button } from "../../components/ui/button";
import { StatusDropdown } from "../../components/general/StatusDropdown";
import { StaffFormModal } from "../../components/admin/StaffFormModal";
import { StaffDeleteModal } from "../../components/admin/StaffDeleteModal";
import { authApi, usersApi, type AuthUser } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";

interface Staff {
  id: number;
  name: string;
  contactNo: string;
  roles: string;
  status: "ACTIVE" | "INACTIVE";
  dateOfBirth: string;
  address: string;
  email: string;
}

export const ManageStaffAccounts = () => {
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const TEMPORARY_PASSWORD = "Temporary123!";
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contactNo: "",
    dateOfBirth: "",
    address: "",
    email: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  const availableRoles = [
    "Librarian",
    "Teacher",
    "Admin",
    "Principal",
    "Vice Principal",
  ];

  const emptyFormState = {
    name: "",
    contactNo: "",
    dateOfBirth: "",
    address: "",
    email: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  };

  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const normalizeRoleLabel = (role: string): string => {
    const clean = role.trim();
    if (!clean) return "";
    if (clean.toLowerCase() === "vice principal") return "Vice Principal";
    if (clean.toLowerCase() === "vice_principal") return "Vice Principal";
    return toTitleCase(clean.replace(/\s+/g, "_"));
  };

  const toApiRole = (role: string): string => {
    const clean = role.trim().toLowerCase();
    if (clean === "vice principal" || clean === "vice_principal")
      return "Vice_Principal";
    if (clean === "librarian") return "Librarian";
    if (clean === "teacher") return "Teacher";
    if (clean === "admin") return "Admin";
    if (clean === "principal") return "Principal";
    return role.trim();
  };

  const normalizeStatus = (status: string): "ACTIVE" | "INACTIVE" =>
    status.toLowerCase() === "active" ? "ACTIVE" : "INACTIVE";

  const normalizeDateForInput = (value?: string | null): string => {
    if (!value) return "";
    // Keep valid HTML date input format as-is.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    // Support ISO timestamps like "2026-04-10T00:00:00.000Z".
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);

    // Fallback for other date-like strings.
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  };

  const mapUserToStaff = (user: AuthUser): Staff => {
    const normalizedRoles = user.roles
      .map((r) => normalizeRoleLabel(r.role))
      .filter(Boolean);

    return {
      id: user.user_id,
      name: `${user.fname} ${user.lname}`.trim(),
      contactNo: user.contact_num || "",
      roles: normalizedRoles.join(", "),
      status: normalizeStatus(user.account_status),
      dateOfBirth: normalizeDateForInput(user.date_of_birth),
      address: user.address || "",
      email: user.email || "",
    };
  };

  const fetchStaffAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [teachers, admins, librarians, principals, vicePrincipals] =
        await Promise.all([
          usersApi.list({ role: "Teacher", limit: 1000 }),
          usersApi.list({ role: "Admin", limit: 1000 }),
          usersApi.list({ role: "Librarian", limit: 1000 }),
          usersApi.list({ role: "Principal", limit: 1000 }),
          usersApi.list({ role: "Vice_Principal", limit: 1000 }),
        ]);

      const merged = new Map<number, Staff>();
      const allUsers = [
        ...teachers.data,
        ...admins.data,
        ...librarians.data,
        ...principals.data,
        ...vicePrincipals.data,
      ];

      allUsers.forEach((user) => {
        const mapped = mapUserToStaff(user);
        if (!merged.has(mapped.id)) {
          merged.set(mapped.id, mapped);
          return;
        }

        const existing = merged.get(mapped.id)!;
        const roleSet = new Set(
          [...existing.roles.split(", "), ...mapped.roles.split(", ")].filter(
            Boolean,
          ),
        );
        merged.set(mapped.id, { ...existing, roles: Array.from(roleSet).join(", ") });
      });

      setStaffList(Array.from(merged.values()));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStaffAccounts();
  }, [fetchStaffAccounts]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  // Filtered staff
  const filteredStaff = useMemo(() => {
    let filtered = staffList.filter((staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (roleFilter !== "all") {
      filtered = filtered.filter((s) =>
        s.roles.toLowerCase().includes(roleFilter.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    return filtered;
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-(--status-active)";
      case "INACTIVE":
        return "text-(--status-inactive)";
      default:
        return "text-gray-900";
    }
  };

  // Get unique roles for filter
  const roles = ["all", "Admin", "Teacher", "Librarian"];

  // Add staff handler
  const handleAddStaff = async () => {
    if (
      !formData.name.trim() ||
      !formData.contactNo.trim() ||
      !formData.dateOfBirth.trim() ||
      !formData.address.trim() ||
      !formData.email.trim() ||
      selectedRoles.length === 0
    )
      return;

    const [firstName, ...restNames] = formData.name.trim().split(/\s+/);
    const lastName = restNames.join(" ") || "-";
    const payload = new FormData();
    payload.append("fname", firstName);
    payload.append("lname", lastName);
    payload.append("date_of_birth", formData.dateOfBirth.trim());
    payload.append("contact_num", formData.contactNo.trim());
    payload.append("address", formData.address.trim());
    payload.append("email", formData.email.trim());
    payload.append("password", TEMPORARY_PASSWORD);
    payload.append("account_status", "Active");
    selectedRoles.forEach((role) => payload.append("roles", toApiRole(role)));

    setIsAddingStaff(true);
    try {
      await authApi.registerEmployee(payload);
      await fetchStaffAccounts();
      setFormData(emptyFormState);
      setSelectedRoles([]);
      setIsAddModalOpen(false);
    } finally {
      setIsAddingStaff(false);
    }
  };

  // Edit staff handlers
  const handleEditClick = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      contactNo: staff.contactNo,
      dateOfBirth: staff.dateOfBirth,
      address: staff.address,
      email: staff.email,
      status: staff.status,
    });
    setSelectedRoles(staff.roles.split(", ").map((r) => r.trim()));
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (
      !editingStaff ||
      !formData.name.trim() ||
      !formData.contactNo.trim() ||
      selectedRoles.length === 0
    )
      return;

    const [firstName, ...restNames] = formData.name.trim().split(/\s+/);
    const lastName = restNames.join(" ") || "-";

    await usersApi.updateProfile(editingStaff.id, {
      fname: firstName,
      lname: lastName,
      date_of_birth: formData.dateOfBirth.trim(),
      contact_num: formData.contactNo.trim(),
      address: formData.address.trim(),
      email: formData.email.trim(),
    });
    await usersApi.updateAccountSettings(editingStaff.id, {
      account_status: formData.status === "ACTIVE" ? "Active" : "Inactive",
      roles: selectedRoles.map(toApiRole),
    });
    await fetchStaffAccounts();
    setFormData(emptyFormState);
    setSelectedRoles([]);
    setEditingStaff(null);
    setIsEditModalOpen(false);
  };

  // Delete staff handlers
  const handleDeleteClick = (staff: Staff) => {
    setDeletingStaff(staff);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;

    await usersApi.delete(deletingStaff.id);
    await fetchStaffAccounts();
    setDeletingStaff(null);
    setIsDeleteModalOpen(false);
  };

  const addFormIsValid =
    formData.name.trim().length > 0 &&
    formData.contactNo.trim().length > 0 &&
    formData.dateOfBirth.trim().length > 0 &&
    formData.address.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    selectedRoles.length > 0;

  return (
    <div className="min-h-screen">
      <NavbarAdmin />
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Staff Accounts</h1>
            <Button
              className="bg-(--button-green) hover:bg-(--button-hover-green) text-white px-6 py-2"
              onClick={() => {
                setFormData(emptyFormState);
                setSelectedRoles([]);
                setIsAddModalOpen(true);
              }}
            >
              Add Staff
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search staff name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <StatusDropdown
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Role"
              options={roles.map((role) => ({
                value: role,
                label: role === "all" ? "Role" : role,
              }))}
            />
            <StatusDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Status"
              options={[
                { value: "all", label: "Status" },
                {
                  value: "ACTIVE",
                  label: "Active",
                  className: "text-(--status-active)",
                },
                {
                  value: "INACTIVE",
                  label: "Inactive",
                  className: "text-(--status-inactive)",
                },
              ]}
            />
          </div>

          {/* Table */}
          {isLoading && (
            <p className="mb-4 text-sm text-gray-500">Loading staff accounts...</p>
          )}
          {filteredStaff.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Contact No.</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Role/s</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6">{staff.name}</td>
                      <td className="py-4 px-6">{staff.contactNo}</td>
                      <td className="py-4 px-6">{staff.roles}</td>
                      <td className={`py-4 px-6 font-bold ${getStatusColor(staff.status)}`}>
                        {staff.status}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditClick(staff)}
                            className="text-(--button-green) hover:text-(--button-hover-green) transition-colors"
                            aria-label="Edit staff"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(staff)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            aria-label="Delete staff"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && filteredStaff.length === 0 && (
            <p className="text-sm text-gray-500">No staff accounts found.</p>
          )}
        </div>
      </div>

      <StaffFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData(emptyFormState);
          setSelectedRoles([]);
        }}
        onSubmit={handleAddStaff}
        title="Add Account"
        submitLabel="Add"
        formData={formData}
        setFormData={setFormData}
        selectedRoles={selectedRoles}
        availableRoles={availableRoles}
        onToggleRole={toggleRole}
        disableSubmit={!addFormIsValid}
        temporaryPassword={TEMPORARY_PASSWORD}
        showStatusField={false}
        isSubmitting={isAddingStaff}
      />

      <StaffFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStaff(null);
          setFormData(emptyFormState);
          setSelectedRoles([]);
        }}
        onSubmit={handleUpdateStaff}
        title="Edit Account"
        submitLabel="Save Changes"
        formData={formData}
        setFormData={setFormData}
        selectedRoles={selectedRoles}
        availableRoles={availableRoles}
        onToggleRole={toggleRole}
        showStatusField
        useEditDisplayStyle
        isEditingSelf={editingStaff?.id === currentUserId}
      />

      <StaffDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingStaff(null);
        }}
        onConfirm={handleDeleteStaff}
        staffName={deletingStaff?.name}
      />
    </div>
  );
};
