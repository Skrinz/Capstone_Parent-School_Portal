import { useState, useMemo, useCallback, useEffect } from "react";
import { Pencil } from "lucide-react";
import { NavbarAdmin } from "../../components/admin/NavbarAdmin";
import { Button } from "../../components/ui/button";
import { StatusDropdown } from "../../components/general/StatusDropdown";
import { StaffFormModal } from "../../components/admin/StaffFormModal";
import { ActionConfirmationModal } from "../../components/general/ActionConfirmationModal";
import { authApi, usersApi, type AuthUser } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";

interface Staff {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  contactNo: string;
  roles: string;
  status: "ACTIVE" | "INACTIVE";
  dateOfBirth: string;
  address: string;
  email: string;
}

const ROLE_DISPLAY_ORDER = ["Admin", "Principal", "Teacher", "Librarian"] as const;

export const ManageStaffAccounts = () => {
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contactNo: "",
    dateOfBirth: "",
    address: "",
    email: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [generatedTemporaryPassword, setGeneratedTemporaryPassword] = useState("");

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof emptyFormState, string>>>({});

  const availableRoles = [
    "Admin",
    "Principal",
    "Teacher",
    "Librarian",
  ];

  const emptyFormState = {
    firstName: "",
    lastName: "",
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

    return toTitleCase(clean.replace(/\s+/g, "_"));
  };

  const sortRoleLabels = (roles: string[]) =>
    [...roles].sort((left, right) => {
      const leftIndex = ROLE_DISPLAY_ORDER.indexOf(
        left as (typeof ROLE_DISPLAY_ORDER)[number],
      );
      const rightIndex = ROLE_DISPLAY_ORDER.indexOf(
        right as (typeof ROLE_DISPLAY_ORDER)[number],
      );

      if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right);
      }
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

  const toApiRole = (role: string): string => {
    const clean = role.trim().toLowerCase();
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
      firstName: user.fname || "",
      lastName: user.lname || "",
      contactNo: user.contact_num || "",
      roles: sortRoleLabels(normalizedRoles).join(", "),
      status: normalizeStatus(user.account_status),
      dateOfBirth: normalizeDateForInput(user.date_of_birth),
      address: user.address || "",
      email: user.email || "",
    };
  };

  const fetchStaffAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [teachers, admins, librarians, principals] =
        await Promise.all([
          usersApi.list({ role: "Teacher", limit: 1000 }),
          usersApi.list({ role: "Admin", limit: 1000 }),
          usersApi.list({ role: "Librarian", limit: 1000 }),
          usersApi.list({ role: "Principal", limit: 1000 }),
        ]);

      const merged = new Map<number, Staff>();
      const allUsers = [
        ...teachers.data,
        ...admins.data,
        ...librarians.data,
        ...principals.data,
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
        merged.set(mapped.id, {
          ...existing,
          roles: sortRoleLabels(Array.from(roleSet)).join(", "),
        });
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
  const hasActiveFilters =
    searchQuery.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

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
  const roles = ["all", ...ROLE_DISPLAY_ORDER];

  const generateTemporaryPassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%&*?";
    const allChars = uppercase + lowercase + numbers + symbols;

    const getRandomChar = (chars: string) =>
      chars[Math.floor(Math.random() * chars.length)];

    const passwordChars = [
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(numbers),
      getRandomChar(symbols),
    ];

    while (passwordChars.length < 12) {
      passwordChars.push(getRandomChar(allChars));
    }

    for (let i = passwordChars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    return passwordChars.join("");
  };

  // Add staff handler
  const handleAddStaff = () => {
    const errors: Partial<Record<keyof typeof emptyFormState, string>> = {};
    
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.contactNo.trim()) errors.contactNo = "Contact number is required";
    if (!formData.dateOfBirth.trim()) errors.dateOfBirth = "Date of birth is required";
    if (!formData.address.trim()) errors.address = "Address is required";
    
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      errors.email = "Email is required";
    } else if (!email.endsWith("@deped.gov.ph")) {
      errors.email = "Staff email must be a @deped.gov.ph address";
    }
    
    if (selectedRoles.length === 0) {
      // Roles doesn't have a specific field
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsAddConfirmOpen(true);
  };

  const handleAddStaffConfirm = async () => {
    setIsAddConfirmOpen(false);
    setIsAddingStaff(true);

    const payload = new FormData();
    payload.append("fname", formData.firstName.trim());
    payload.append("lname", formData.lastName.trim());
    payload.append("date_of_birth", formData.dateOfBirth.trim());
    payload.append("contact_num", formData.contactNo.trim());
    payload.append("address", formData.address.trim());
    payload.append("email", formData.email.trim());
    payload.append("password", generatedTemporaryPassword);
    payload.append("account_status", "Active");
    selectedRoles.forEach((role) => payload.append("roles", toApiRole(role)));

    setIsAddingStaff(true);
    try {
      await authApi.registerEmployee(payload);
      await fetchStaffAccounts();
      setFormData(emptyFormState);
      setSelectedRoles([]);
      setGeneratedTemporaryPassword("");
      setIsAddModalOpen(false);
      setFormErrors({});
    } catch (error: any) {
      if (error.status === 400 && error.message) {
        // Handle backend validation errors if they return a specific field
        setFormErrors({ email: error.message });
      }
    } finally {
      setIsAddingStaff(false);
    }
  };

  // Edit staff handlers
  const handleEditClick = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      contactNo: staff.contactNo,
      dateOfBirth: staff.dateOfBirth,
      address: staff.address,
      email: staff.email,
      status: staff.status,
    });
    setSelectedRoles(staff.roles.split(", ").map((r) => r.trim()));
    setIsEditModalOpen(true);
    setFormErrors({});
  };

  const handleUpdateStaff = () => {
    const errors: Partial<Record<keyof typeof emptyFormState, string>> = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.contactNo.trim()) errors.contactNo = "Contact number is required";
    
    const email = formData.email.trim().toLowerCase();
    if (!email.endsWith("@deped.gov.ph")) {
      errors.email = "Staff email must be a @deped.gov.ph address";
    }

    if (Object.keys(errors).length > 0 || selectedRoles.length === 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsEditConfirmOpen(true);
  };

  const handleUpdateStaffConfirm = async () => {
    setIsEditConfirmOpen(false);
    setIsAddingStaff(true);
    try {
      await usersApi.updateProfile(editingStaff!.id, {
        fname: formData.firstName.trim(),
        lname: formData.lastName.trim(),
        date_of_birth: formData.dateOfBirth.trim(),
        contact_num: formData.contactNo.trim(),
        address: formData.address.trim(),
        email: formData.email.trim(),
      });
      await usersApi.updateAccountSettings(editingStaff!.id, {
        account_status: formData.status === "ACTIVE" ? "Active" : "Inactive",
        roles: selectedRoles.map(toApiRole),
      });
      await fetchStaffAccounts();
      setFormData(emptyFormState);
      setSelectedRoles([]);
      setEditingStaff(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update staff:", error);
    } finally {
      setIsAddingStaff(false);
    }
  };

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
                setGeneratedTemporaryPassword(generateTemporaryPassword());
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
            {hasActiveFilters ? (
              <Button
                type="button"
                className="bg-(--status-inactive) text-white hover:brightness-110"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            ) : null}
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
                        <button
                          onClick={() => handleEditClick(staff)}
                          className="text-(--button-green) hover:text-(--button-hover-green) transition-colors"
                          aria-label="Edit staff"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
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
          setGeneratedTemporaryPassword("");
          setFormErrors({});
        }}
        onSubmit={handleAddStaff}
        title="Add Account"
        submitLabel="Add"
        formData={formData}
        setFormData={setFormData}
        selectedRoles={selectedRoles}
        availableRoles={availableRoles}
        onToggleRole={toggleRole}
        temporaryPassword={generatedTemporaryPassword}
        showStatusField={false}
        isSubmitting={isAddingStaff}
        errors={formErrors}
      />

      <StaffFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStaff(null);
          setFormData(emptyFormState);
          setSelectedRoles([]);
          setFormErrors({});
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
        isSubmitting={isAddingStaff}
        errors={formErrors}
      />

      <ActionConfirmationModal
        isOpen={isAddConfirmOpen}
        onClose={() => setIsAddConfirmOpen(false)}
        onConfirm={handleAddStaffConfirm}
        title="Confirm Add Staff"
        message={`Are you sure you want to add ${formData.firstName} ${formData.lastName} as a staff member?`}
        confirmLabel="Add Staff"
        isLoading={isAddingStaff}
      />

      <ActionConfirmationModal
        isOpen={isEditConfirmOpen}
        onClose={() => setIsEditConfirmOpen(false)}
        onConfirm={handleUpdateStaffConfirm}
        title="Confirm Update Staff"
        message={`Are you sure you want to update the account for ${formData.firstName} ${formData.lastName}?`}
        confirmLabel="Update Staff"
        isLoading={isAddingStaff}
      />
    </div>
  );
};
