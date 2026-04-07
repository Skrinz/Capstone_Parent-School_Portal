import { useState, useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { NavbarAdmin } from "../../components/admin/NavbarAdmin";
import { Button } from "../../components/ui/button";
import { StatusDropdown } from "../../components/general/StatusDropdown";
import { StaffFormModal } from "../../components/admin/StaffFormModal";
import { StaffDeleteModal } from "../../components/admin/StaffDeleteModal";

interface Staff {
  id: number;
  name: string;
  contactNo: string;
  roles: string;
  status: "ACTIVE" | "INACTIVE";
}

export const ManageStaffAccounts = () => {
  // Sample data - replace with actual data from your backend
  const [staffList, setStaffList] = useState<Staff[]>([
    { id: 1, name: "Johnathan Doe", contactNo: "0913 812 1213", roles: "Librarian", status: "ACTIVE" },
    { id: 2, name: "Emily Carter", contactNo: "0917 123 4567", roles: "Admin, Teacher", status: "ACTIVE" },
    { id: 3, name: "Marcus Lee", contactNo: "0927 456 7890", roles: "Teacher", status: "ACTIVE" },
    { id: 4, name: "Priya Desai", contactNo: "0915 234 6789", roles: "Teacher", status: "ACTIVE" },
    { id: 5, name: "David Johnson", contactNo: "0905 789 1234", roles: "Teacher", status: "ACTIVE" },
    { id: 6, name: "Sofia Martinez", contactNo: "0926 345 9876", roles: "Teacher, Librarian", status: "ACTIVE" },
    { id: 7, name: "Liam O'Connor", contactNo: "0918 654 3210", roles: "Teacher", status: "INACTIVE" },
  ]);

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

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  const availableRoles = ["Librarian", "Teacher", "Admin", "Principal", "Vice Principal"];

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  // Filtered staff
  const filteredStaff = useMemo(() => {
    let filtered = staffList.filter((staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (roleFilter !== "all") {
      filtered = filtered.filter((s) => s.roles.toLowerCase().includes(roleFilter.toLowerCase()));
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
  const handleAddStaff = () => {
    if (!formData.name.trim() || !formData.contactNo.trim() || selectedRoles.length === 0) return;

    const newStaff: Staff = {
      id: Math.max(...staffList.map((s) => s.id), 0) + 1,
      name: formData.name,
      contactNo: formData.contactNo,
      roles: selectedRoles.join(", "),
      status: formData.status,
    };

    setStaffList([...staffList, newStaff]);
    setFormData({
      name: "",
      contactNo: "",
      dateOfBirth: "",
      address: "",
      email: "",
      status: "ACTIVE",
    });
    setSelectedRoles([]);
    setIsAddModalOpen(false);
  };

  // Edit staff handlers
  const handleEditClick = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      contactNo: staff.contactNo,
      dateOfBirth: "",
      address: "",
      email: "",
      status: staff.status,
    });
    setSelectedRoles(staff.roles.split(", ").map(r => r.trim()));
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = () => {
    if (!editingStaff || !formData.name.trim() || !formData.contactNo.trim() || selectedRoles.length === 0)
      return;

    setStaffList(
      staffList.map((staff) =>
        staff.id === editingStaff.id
          ? {
              ...staff,
              name: formData.name,
              contactNo: formData.contactNo,
              roles: selectedRoles.join(", "),
              status: formData.status,
            }
          : staff,
      ),
    );
    setFormData({
      name: "",
      contactNo: "",
      dateOfBirth: "",
      address: "",
      email: "",
      status: "ACTIVE",
    });
    setSelectedRoles([]);
    setEditingStaff(null);
    setIsEditModalOpen(false);
  };

  // Delete staff handlers
  const handleDeleteClick = (staff: Staff) => {
    setDeletingStaff(staff);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStaff = () => {
    if (!deletingStaff) return;

    setStaffList(
      staffList.filter((staff) => staff.id !== deletingStaff.id),
    );
    setDeletingStaff(null);
    setIsDeleteModalOpen(false);
  };

  const editFormHasChanges = editingStaff
    ? formData.name.trim() !== editingStaff.name.trim() ||
      formData.contactNo.trim() !== editingStaff.contactNo.trim() ||
      formData.status !== editingStaff.status ||
      selectedRoles.join(", ") !== editingStaff.roles
    : false;

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
                setFormData({
                  name: "",
                  contactNo: "",
                  dateOfBirth: "",
                  address: "",
                  email: "",
                  status: "ACTIVE",
                });
                setSelectedRoles([]);
                setIsAddModalOpen(true);
              }}
            >
              Add Teacher
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
              options={roles.map(role => ({
                value: role,
                label: role === "all" ? "Role" : role
              }))}
            />
            <StatusDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Status"
              options={[
                { value: "all", label: "Status" },
                { value: "ACTIVE", label: "Active", className: "text-(--status-active)" },
                { value: "INACTIVE", label: "Inactive", className: "text-(--status-inactive)" },
              ]}
            />
          </div>

          {/* Table */}
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
        </div>
      </div>

      <StaffFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({
            name: "",
            contactNo: "",
            dateOfBirth: "",
            address: "",
            email: "",
            status: "ACTIVE",
          });
          setSelectedRoles([]);
        }}
        onSubmit={handleAddStaff}
        title="Add Staff"
        submitLabel="Add"
        formData={formData}
        setFormData={setFormData}
        selectedRoles={selectedRoles}
        availableRoles={availableRoles}
        onToggleRole={toggleRole}
        disableSubmit={!editFormHasChanges}
      />

      <StaffFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStaff(null);
          setFormData({
            name: "",
            contactNo: "",
            dateOfBirth: "",
            address: "",
            email: "",
            status: "ACTIVE",
          });
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
