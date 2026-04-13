import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";

type StaffStatus = "ACTIVE" | "INACTIVE";

interface StaffFormData {
  name: string;
  contactNo: string;
  dateOfBirth: string;
  address: string;
  email: string;
  status: StaffStatus;
}

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitLabel: string;
  formData: StaffFormData;
  setFormData: React.Dispatch<React.SetStateAction<StaffFormData>>;
  selectedRoles: string[];
  availableRoles: string[];
  onToggleRole: (role: string) => void;
  disableSubmit?: boolean;
  temporaryPassword?: string;
  showStatusField?: boolean;
  isSubmitting?: boolean;
  useEditDisplayStyle?: boolean;
  isEditingSelf?: boolean;
}

export const StaffFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitLabel,
  formData,
  setFormData,
  selectedRoles,
  availableRoles,
  onToggleRole,
  disableSubmit = false,
  temporaryPassword,
  showStatusField = true,
  isSubmitting = false,
  useEditDisplayStyle = false,
  isEditingSelf = false,
}: StaffFormModalProps) => {
  const isProfileReadOnly = useEditDisplayStyle;
  const formatDateForDisplay = (value: string) => {
    if (!value) return "";
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    const year = parsed.getUTCFullYear();
    return `${month}/${day}/${year}`;
  };

  const inputClassName = useEditDisplayStyle
    ? "h-12 w-full rounded-none border border-transparent bg-transparent px-0 text-[18px] leading-none text-gray-900 focus:outline-none"
    : "h-12 w-full rounded-none border border-transparent bg-[#efefef] px-4 text-xl leading-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--button-green)";
  const rowClassName = "grid grid-cols-[170px_1fr] items-center gap-3";
  const labelClassName = "text-[18px] font-bold leading-tight text-black";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      contentClassName={`bg-[#ece8b8] ${useEditDisplayStyle ? "max-w-[760px]" : "max-w-[640px]"}`}
    >
      <div className={`space-y-2 ${useEditDisplayStyle ? "pt-1" : ""}`}>
        <div className={rowClassName}>
          <label className={labelClassName}>Full Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            readOnly={isProfileReadOnly}
            className={inputClassName}
          />
        </div>
        <div className={rowClassName}>
          <label className={labelClassName}>Contact No:</label>
          <input
            type="tel"
            value={formData.contactNo}
            onChange={(e) => setFormData({ ...formData, contactNo: e.target.value.replace(/\D/g, "") })}
            readOnly={isProfileReadOnly}
            className={inputClassName}
          />
        </div>
        <div className={rowClassName}>
          <label className={labelClassName}>Date of Birth:</label>
          {isProfileReadOnly ? (
            <input
              type="text"
              value={formatDateForDisplay(formData.dateOfBirth)}
              readOnly
              className={inputClassName}
            />
          ) : (
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              max={new Date().toISOString().split("T")[0]}
              className={`${inputClassName} pr-3 [color-scheme:light] [&::-webkit-datetime-edit]:text-gray-800 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100`}
            />
          )}
        </div>
        <div className={rowClassName}>
          <label className={labelClassName}>Address:</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            readOnly={isProfileReadOnly}
            className={inputClassName}
          />
        </div>
        <div className={rowClassName}>
          <label className={labelClassName}>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            readOnly={isProfileReadOnly}
            className={inputClassName}
          />
        </div>
        {temporaryPassword ? (
          <div className={rowClassName}>
            <p className={labelClassName}>
              Temporary
              <br />
              Password:
            </p>
            <p className="px-1 py-2 font-mono text-[32px] leading-none text-black">
              {temporaryPassword}
            </p>
          </div>
        ) : null}
        <div className="grid grid-cols-[170px_1fr] gap-3 pt-1">
          <p className={labelClassName}>Role/s:</p>
          <div className="flex flex-col gap-2">
            <div className={`flex flex-wrap ${useEditDisplayStyle ? "max-w-[470px] gap-3" : "gap-2"}`}>
              {availableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => !isEditingSelf && onToggleRole(role)}
                  disabled={isEditingSelf}
                  title={isEditingSelf ? "You cannot edit your own roles" : undefined}
                  className={`${useEditDisplayStyle ? "min-w-[142px] text-[17px]" : "min-w-[112px] text-lg"} rounded-xl px-4 py-2 font-medium leading-tight text-white transition-colors ${
                    isEditingSelf
                      ? "cursor-not-allowed bg-gray-300"
                      : selectedRoles.includes(role)
                        ? "bg-(--button-green)"
                        : "bg-gray-500 hover:bg-gray-600"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {isEditingSelf && (
              <p className="text-[13px] text-gray-500 italic">
                You cannot edit your own roles.
              </p>
            )}
          </div>
        </div>
        {showStatusField ? (
          <div className="grid grid-cols-[170px_1fr] items-start gap-3 pt-1">
            <p className={`${labelClassName} pt-3`}>Status:</p>
            <div className="flex flex-col gap-1">
              <div
                className={`relative ${useEditDisplayStyle ? "max-w-[250px]" : "max-w-[230px]"}`}
              >
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as StaffStatus })
                  }
                  disabled={isEditingSelf}
                  className={`h-12 w-full appearance-none ${
                    useEditDisplayStyle
                      ? `${isEditingSelf ? "bg-gray-100 cursor-not-allowed" : "bg-white"} text-[18px]`
                      : `${isEditingSelf ? "bg-gray-200 cursor-not-allowed" : "bg-[#efefef]"} text-xl`
                  } px-4 pr-12 leading-none font-semibold ${
                    formData.status === "ACTIVE"
                      ? "text-(--status-active)"
                      : "text-(--status-inactive)"
                  } focus:outline-none ${useEditDisplayStyle ? "" : "focus:ring-2 focus:ring-(--button-green)"}`}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <span
                  className={`pointer-events-none absolute top-1/2 h-0 w-0 -translate-y-1/2 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-black ${useEditDisplayStyle ? "right-5" : "right-4"}`}
                />
              </div>
              {isEditingSelf && (
                <p className="text-[13px] text-gray-500 italic">
                  You cannot edit your own status.
                </p>
              )}
            </div>
          </div>
        ) : null}
        <div className={`flex justify-end ${useEditDisplayStyle ? "pt-3" : "pt-1"}`}>
          <Button
            onClick={onSubmit}
            disabled={disableSubmit || isSubmitting}
            className={`${useEditDisplayStyle ? "h-12 min-w-[205px] text-[18px]" : "h-12 min-w-32 text-2xl"} rounded-full bg-(--button-green) px-8 font-semibold text-white hover:bg-(--button-hover-green) disabled:bg-gray-400 disabled:text-white disabled:hover:bg-gray-400`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Adding...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
