import { NavbarParent } from "@/components/parent/NavbarParent";
import { ApplyRegistrationModal } from "@/components/parent/RegistrationModal";
import { PendingDetailsModal } from "@/components/parent/PendingDetailsModal";
import { DeniedDetailsModal } from "@/components/parent/DeniedDetailsModal";
import type { PendingUploads, UploadedDoc } from "@/components/parent/parentModalTypes";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";
import { useParentStore } from "@/lib/store/parentStore";
import type { ParentRegistrationEntry } from "@/lib/api/parentsApi";
import { validateFiles } from "@/lib/fileValidation";
import { resolveMediaUrl } from "@/lib/api/base";

// A unified card shape used internally for rendering
interface ChildCard {
  student_id: number;
  fname: string;
  lname: string;
  lrn_number: string;
  status: string;
  // For verified/enrolled
  grade_level?: { grade_level: string };
  section?: { section_name: string; adviser?: { fname: string; lname: string } | null };
  syear_start?: number;
  syear_end?: number;
  // For pending/denied — comes from the registration record
  date_submitted?: string;
  remarks?: string | null;
  uploadedFiles?: { name: string; url?: string }[];
  pr_id?: number;
}

export const ParentView = () => {
  const navigate = useNavigate();
  const { showError, clearFeedback, showSuccess } = useApiFeedbackStore();
  const { children, registrations, fetchChildren, setActiveChild, submitRegistration, resubmitRegistration, loading } = useParentStore();
  
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [isDeniedModalOpen, setIsDeniedModalOpen] = useState(false);
  const [activeLocalChild, setActiveLocalChild] = useState<ChildCard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const [pendingUploadTarget, setPendingUploadTarget] = useState<keyof PendingUploads>("parentBirthCertificate");
  const [pendingUploads, setPendingUploads] = useState<PendingUploads>({
    parentBirthCertificate: null,
    governmentId: null,
    childBirthCertificate: null,
  });

  const [deniedUploads, setDeniedUploads] = useState<File[]>([]);

  const [selectedPreviewName, setSelectedPreviewName] = useState("");
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // ─── Build unified card list ─────────────────────────────────────────────────
  // Set of verified student IDs so we don't show duplicate cards
  const verifiedStudentIds = new Set(children.map((c: any) => c.student_id));

  // Convert registrations (PENDING / DENIED) into ChildCard entries
  const registrationCards: ChildCard[] = [];
  registrations.forEach((reg: ParentRegistrationEntry) => {
    // Only surface PENDING and DENIED — VERIFIED students already appear in children[]
    if (reg.status === "VERIFIED") return;

    reg.students.forEach(({ student }) => {
      // Skip if already shown via verified children
      if (verifiedStudentIds.has(student.student_id)) return;

      registrationCards.push({
        student_id: student.student_id,
        fname: student.fname,
        lname: student.lname,
        lrn_number: student.lrn_number,
        grade_level: student.grade_level ?? undefined,
        status: reg.status,
        date_submitted: reg.submitted_at,
        remarks: reg.remarks,
        uploadedFiles: reg.files.map(({ file }) => ({
          name: file.file_name,
          url: file.file_path ? resolveMediaUrl(file.file_path) : undefined,
        })),
        pr_id: reg.pr_id,
      });
    });
  });

  // Verified/enrolled children mapped to ChildCard
  const verifiedCards: ChildCard[] = children.map((c: any) => ({
    ...c,
    status: c.status || "VERIFIED",
  }));

  // Final merged list: verified first (they come from getMyChildren), then pending/denied
  const allCards: ChildCard[] = [...verifiedCards, ...registrationCards];

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "ENROLLED":
        return "text-[#4caf50] font-bold";
      case "PENDING":
        return "text-[#fbc02d] font-bold";
      case "DENIED":
        return "text-[#d32f2f] font-bold";
      default:
        return "text-black font-bold";
    }
  };

  const isPendingFormValid = Boolean(
    pendingUploads.childBirthCertificate &&
      (pendingUploads.parentBirthCertificate || pendingUploads.governmentId)
  );

  const isDeniedFormValid = deniedUploads.length >= 2;

  const resetPreview = () => {
    setSelectedPreviewName("");
    setSelectedPreviewUrl("");
  };

  const openApplyModal = () => {
    setIsApplyModalOpen(true);
  };

  const handlePendingFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    clearFeedback();
    const validation = validateFiles([file], {
      acceptedTypes: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 10,
      label: "parent registration document",
    });
    if (!validation.valid) {
      showError(validation.error);
      event.target.value = "";
      return;
    }
    setPendingUploads((prev) => ({ ...prev, [pendingUploadTarget]: file }));
  };

  const handleDeniedFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    clearFeedback();
    
    const validation = validateFiles(files, {
      acceptedTypes: [".pdf", ".jpg", ".jpeg", ".png"],
      maxSizeMB: 10,
      label: "parent registration document",
    });
    
    if (!validation.valid) {
      showError(validation.error);
      event.target.value = "";
      return;
    }
    
    setDeniedUploads((prev) => [...prev, ...files]);
    event.target.value = ""; // Reset input to allow same file selection
  };

  const handleRemoveDeniedFile = (index: number) => {
    setDeniedUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePendingPreview = (doc: UploadedDoc) => {
    const previewUrl = doc.url || (doc.file ? URL.createObjectURL(doc.file) : "");
    setSelectedPreviewName(doc.name);
    setSelectedPreviewUrl(previewUrl);
  };

  const handleOpenPdf = (doc: UploadedDoc) => {
    const pdfUrl = doc.url || (doc.file ? URL.createObjectURL(doc.file) : "");
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSubmitRegistration = async (studentToRegister: any) => {
    if (!isPendingFormValid) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("student_ids", JSON.stringify([studentToRegister.student_id]));
      
      if (pendingUploads.parentBirthCertificate) {
        formData.append("attachments", pendingUploads.parentBirthCertificate);
      }
      if (pendingUploads.governmentId) {
        formData.append("attachments", pendingUploads.governmentId);
      }
      if (pendingUploads.childBirthCertificate) {
        formData.append("attachments", pendingUploads.childBirthCertificate);
      }

      await submitRegistration(formData);
      setIsApplyModalOpen(false);
      showSuccess("Registration submitted successfully.");
    } catch (err: any) {
      showError(err.message || "Failed to submit registration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmitDenied = async () => {
    if (!isDeniedFormValid || !activeLocalChild) return;
    
    setIsResubmitting(true);
    try {
      const formData = new FormData();
      formData.append("student_ids", JSON.stringify([activeLocalChild.student_id]));
      
      deniedUploads.forEach((file) => {
        formData.append("attachments", file);
      });

      if (activeLocalChild.pr_id) {
        await resubmitRegistration(activeLocalChild.pr_id, formData);
      } else {
        await submitRegistration(formData);
      }
      
      setIsDeniedModalOpen(false);
      showSuccess("Registration resubmitted successfully.");
      
      // Reset denied uploads
      setDeniedUploads([]);
    } catch (err: any) {
      showError(err.message || "Failed to resubmit registration");
    } finally {
      setIsResubmitting(false);
    }
  };

  const handleChildCardClick = (card: ChildCard) => {
    setActiveLocalChild(card);

    if (card.status === "VERIFIED" || card.status === "ENROLLED") {
      // Cast back to ParentChild shape for the store
      setActiveChild(card as any);
      navigate("/classschedule");
      return;
    }

    if (card.status === "PENDING") {
      resetPreview();
      setIsPendingModalOpen(true);
      return;
    }

    if (card.status === "DENIED") {
      setIsDeniedModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <NavbarParent />

      {/* Main Content */}
      <main className="px-6 py-12">
        {/* Apply for Registration Button */}
        <div className="flex justify-center mb-12 mt-4">
          <Button
            className="text-white px-8 py-6 rounded-md text-lg font-bold shadow hover:bg-green-600 flex flex-col items-center justify-center leading-tight tracking-wider"
            style={{ backgroundColor: "#4eb862" }}
            onClick={openApplyModal}
          >
            <span>APPLY FOR</span>
            <span>REGISTRATION</span>
          </Button>
        </div>

        {/* Select a Child Section */}
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-8 text-center text-black tracking-wide">Select a Child</h1>

          {/* Notes */}
          <div className="mb-8 italic text-gray-600">
            <p className="mb-1">Notes:</p>
            <ul className="space-y-1 text-sm list-disc pl-6 leading-relaxed">
              <li>Parents need to register their child first and wait for verification before they can access the child's class schedule, grades, and library records.</li>
              <li>You can also select a child with a Pending registration status to view further details of your application.</li>
              <li>If your registration is denied, please select that child to view further details.</li>
            </ul>
          </div>

          {/* Child Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#4eb862]"></div>
                <p className="mt-4 text-gray-600 font-medium">Fetching student data...</p>
              </div>
            ) : allCards.length === 0 ? (
              <div className="col-span-full text-center p-8 text-gray-500 italic border-2 border-dashed border-gray-300 rounded-lg">
                No child data found. Please apply for registration.
              </div>
            ) : allCards.map((card) => {
              const fullName = `${card.fname} ${card.lname}`;
              const status = card.status;
              
              return (
                <div
                  key={`${card.status}-${card.pr_id ?? card.student_id}`}
                  className="p-5 cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg"
                  style={{ border: "1px solid #000000", backgroundColor: "#ffffe0" }}
                  onClick={() => handleChildCardClick(card)}
                >
                  {/* Child Name and Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-black">{fullName}</h2>
                    <span
                      className={`text-sm tracking-wide uppercase ${getStatusBadgeColor(status)}`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* Child Details - Verified/Enrolled Status */}
                  {(status === "VERIFIED" || status === "ENROLLED") && (
                    <div className="text-sm space-y-1 text-black">
                      <p>
                        LRN: <span className="font-bold">{card.lrn_number || "—"}</span>
                      </p>
                      <p>
                        Grade Level &amp; Section:{" "}
                        <span className="font-bold">
                          {card.grade_level?.grade_level || "—"} - {card.section?.section_name || "—"}
                        </span>
                      </p>
                      <p>
                        School Year:{" "}
                        <span className="font-bold">
                          {card.syear_start || "—"} - {card.syear_end || "—"}
                        </span>
                      </p>
                      <p>
                        Class Adviser:{" "}
                        <span className="font-bold">
                          {card.section?.adviser ? `${card.section.adviser.fname} ${card.section.adviser.lname}` : "—"}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Child Details - Pending Status */}
                  {status === "PENDING" && (
                    <div className="text-sm space-y-1 text-black">
                      <p>
                        <span className="font-bold">Date Submitted:</span>{" "}
                        {card.date_submitted ? new Date(card.date_submitted).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                      </p>
                      {card.remarks && (
                        <p>
                          <span className="font-bold">Remarks:</span>{" "}
                          {card.remarks}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Child Details - Denied Status */}
                  {status === "DENIED" && (
                    <div className="text-sm space-y-1 text-black">
                      <p>
                        <span className="font-bold">Date Submitted:</span>{" "}
                        {card.date_submitted ? new Date(card.date_submitted).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                      </p>
                      {card.remarks && (
                        <p>
                          <span className="font-bold">Remarks:</span>{" "}
                          {card.remarks}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <ApplyRegistrationModal
        isOpen={isApplyModalOpen}
        pendingUploads={pendingUploads}
        isFormValid={isPendingFormValid}
        onSetUploadTarget={setPendingUploadTarget}
        onPendingFileChange={handlePendingFileChange}
        onRemovePendingFile={(key) => setPendingUploads((prev) => ({ ...prev, [key]: null }))}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleSubmitRegistration}
        isSubmitting={isSubmitting}
      />

      <PendingDetailsModal
        isOpen={isPendingModalOpen}
        child={activeLocalChild?.status === "PENDING" ? {
          id: String(activeLocalChild.student_id),
          name: `${activeLocalChild.fname} ${activeLocalChild.lname}`,
          status: "PENDING",
          dateSubmitted: activeLocalChild.date_submitted
            ? new Date(activeLocalChild.date_submitted).toLocaleDateString()
            : undefined,
          remarks: activeLocalChild.remarks ?? undefined,
          uploadedFiles: activeLocalChild.uploadedFiles,
        } : null}
        files={(activeLocalChild?.uploadedFiles ?? []).map((doc) => ({ name: doc.name, url: doc.url }))}
        selectedPreviewName={selectedPreviewName}
        selectedPreviewUrl={selectedPreviewUrl}
        onPreview={handlePendingPreview}
        onOpenPdf={handleOpenPdf}
        onClose={() => {
          setIsPendingModalOpen(false);
          resetPreview();
        }}
      />

      <DeniedDetailsModal
        isOpen={isDeniedModalOpen}
        child={activeLocalChild?.status === "DENIED" ? {
          id: String(activeLocalChild.student_id),
          name: `${activeLocalChild.fname} ${activeLocalChild.lname}`,
          status: "DENIED",
          dateSubmitted: activeLocalChild.date_submitted
            ? new Date(activeLocalChild.date_submitted).toLocaleDateString()
            : undefined,
          remarks: activeLocalChild.remarks ?? undefined,
          uploadedFiles: activeLocalChild.uploadedFiles,
        } : null}
        deniedUploads={deniedUploads}
        isFormValid={isDeniedFormValid}
        onDeniedFileChange={handleDeniedFileChange}
        onRemoveDeniedFile={handleRemoveDeniedFile}
        onResubmit={handleResubmitDenied}
        onClose={() => setIsDeniedModalOpen(false)}
        isSubmitting={isResubmitting}
      />
    </div>
  );
}
