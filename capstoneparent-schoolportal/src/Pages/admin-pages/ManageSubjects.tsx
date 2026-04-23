import { useEffect, useMemo, useState } from "react";
import { Archive, AlertTriangle, Loader2, Plus, Search } from "lucide-react";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { subjectsApi, type GradeLevelOption, type ManagedSubject } from "@/lib/api/subjectsApi";
import { useApiFeedbackStore } from "@/lib/store/apiFeedbackStore";

export const ManageSubjects = () => {
  const showError = useApiFeedbackStore((state) => state.showError);
  const showSuccess = useApiFeedbackStore((state) => state.showSuccess);
  const [subjects, setSubjects] = useState<ManagedSubject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevelOption[]>([]);
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<number | null>(null);
  const [pendingAssignedSubjectIds, setPendingAssignedSubjectIds] = useState<number[]>([]);
  const [pendingUnassignedSubjectIds, setPendingUnassignedSubjectIds] = useState<number[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [subjectToArchive, setSubjectToArchive] = useState<ManagedSubject | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [archivedSubjects, setArchivedSubjects] = useState<ManagedSubject[]>([]);
  const [showAddSubjectConfirm, setShowAddSubjectConfirm] = useState(false);
  const [showAssignSubjectConfirm, setShowAssignSubjectConfirm] = useState(false);
  const [showUnassignSubjectConfirm, setShowUnassignSubjectConfirm] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subjectsResponse, gradeLevelsResponse, archivedSubjectsResponse] = await Promise.all([
        subjectsApi.getAllSubjects(),
        subjectsApi.getGradeLevels(),
        subjectsApi.getArchivedSubjects(),
      ]);

      setSubjects(subjectsResponse.data);
      setGradeLevels(gradeLevelsResponse.data);
      setArchivedSubjects(archivedSubjectsResponse.data);
      setSelectedGradeLevelId((current) => current ?? gradeLevelsResponse.data[0]?.gl_id ?? null);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPendingAssignedSubjectIds([]);
    setPendingUnassignedSubjectIds([]);
  }, [selectedGradeLevelId]);

  const libraryFilteredSubjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return subjects.filter((subject) => subject.name.toLowerCase().includes(normalizedQuery));
  }, [searchQuery, subjects]);

  const archivedFilteredSubjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return archivedSubjects.filter((subject) => subject.name.toLowerCase().includes(normalizedQuery));
  }, [searchQuery, archivedSubjects]);
  const hasActiveFilters =
    searchQuery.trim() !== "" || activeTab !== "active";

  const assignedSubjectIds = useMemo(() => {
    if (!selectedGradeLevelId) {
      return new Set<number>();
    }

    return new Set(
      subjects
        .filter((subject) =>
          subject.grade_levels.some((item) => item.grade_level.gl_id === selectedGradeLevelId),
        )
        .map((subject) => subject.subject_id),
    );
  }, [selectedGradeLevelId, subjects]);

  const selectedGradeLevel = gradeLevels.find(
    (gradeLevel) => gradeLevel.gl_id === selectedGradeLevelId,
  );

  const pendingAssignedSubjectIdSet = useMemo(
    () => new Set(pendingAssignedSubjectIds),
    [pendingAssignedSubjectIds],
  );

  const pendingUnassignedSubjectIdSet = useMemo(
    () => new Set(pendingUnassignedSubjectIds),
    [pendingUnassignedSubjectIds],
  );

  const confirmCreateSubject = async () => {
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) {
      showError("Subject name is required");
      return;
    }

    setIsSaving(true);
    try {
      await subjectsApi.createSubject(trimmedName);
      setNewSubjectName("");
      setShowAddSubjectConfirm(false);
      await loadData();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to add subject");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubject = () => {
    const trimmedName = newSubjectName.trim();
    if (!trimmedName) {
      showError("Subject name is required");
      return;
    }
    setShowAddSubjectConfirm(true);
  };

  const handleArchiveSubject = (subject: ManagedSubject) => {
    setSubjectToArchive(subject);
  };

  const confirmArchive = async () => {
    if (!subjectToArchive) return;

    setIsSaving(true);
    try {
      await subjectsApi.archiveSubject(subjectToArchive.subject_id);
      setSubjectToArchive(null);
      await loadData();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to archive subject");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnarchiveSubject = async (subject: ManagedSubject) => {
    setIsSaving(true);
    try {
      await subjectsApi.unarchiveSubject(subject.subject_id);
      showSuccess(`${subject.name} has been unarchived.`);
      await loadData();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to unarchive subject");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePendingAssignment = (subjectId: number) => {
    setPendingAssignedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((item) => item !== subjectId)
        : [...current, subjectId],
    );
  };

  const handleTogglePendingUnassignment = (subjectId: number) => {
    setPendingUnassignedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((item) => item !== subjectId)
        : [...current, subjectId],
    );
  };

  const confirmAssignSubjects = async () => {
    if (!selectedGradeLevelId) return;

    setIsSaving(true);
    try {
      await subjectsApi.assignSubjectsToGradeLevel(selectedGradeLevelId, pendingAssignedSubjectIds);
      showSuccess(
        `${pendingAssignedSubjectIds.length} subject${pendingAssignedSubjectIds.length === 1 ? "" : "s"} assigned successfully.`,
      );
      setPendingAssignedSubjectIds([]);
      setShowAssignSubjectConfirm(false);
      await loadData();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to assign subjects");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignSubjects = () => {
    if (!selectedGradeLevelId) {
      showError("Select a grade level first");
      return;
    }

    if (pendingAssignedSubjectIds.length === 0) {
      showError("Select at least one subject to assign");
      return;
    }

    setShowAssignSubjectConfirm(true);
  };

  const confirmUnassignSubjects = async () => {
    if (!selectedGradeLevelId) return;

    setIsSaving(true);
    try {
      await subjectsApi.unassignSubjectsFromGradeLevel(selectedGradeLevelId, pendingUnassignedSubjectIds);
      showSuccess(
        `${pendingUnassignedSubjectIds.length} subject${pendingUnassignedSubjectIds.length === 1 ? "" : "s"} unassigned successfully.`,
      );
      setPendingUnassignedSubjectIds([]);
      setShowUnassignSubjectConfirm(false);
      await loadData();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to unassign subjects");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassignSubjects = () => {
    if (!selectedGradeLevelId) {
      showError("Select a grade level first");
      return;
    }

    if (pendingUnassignedSubjectIds.length === 0) {
      showError("Select at least one subject to unassign");
      return;
    }

    setShowUnassignSubjectConfirm(true);
  };

  return (
    <div className="min-h-screen bg-[#efefef]">
      <RoleAwareNavbar />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Manage Subjects
          </h1>
          <p className="mt-3 text-base text-gray-600">
            Define reusable subjects per grade level. New classes inherit these subjects automatically.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-gray-200 bg-white/95 p-5 shadow-xl sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search subjects..."
                    className="h-12 bg-white pl-10"
                  />
                </div>
                <div className="flex flex-1 gap-2">
                  <Input
                    value={newSubjectName}
                    onChange={(event) => setNewSubjectName(event.target.value)}
                    placeholder="Add a new subject"
                    className="h-12 bg-white"
                  />
                  <Button
                    type="button"
                    onClick={handleCreateSubject}
                    disabled={isSaving}
                    className="h-12 bg-(--button-green) px-4 text-white hover:bg-green-700"
                  >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  </Button>
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveTab("active");
                      }}
                      className="h-12 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Clear Filters
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  className={`pb-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    activeTab === "active"
                      ? "border-b-2 border-green-600 text-green-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Active Subjects
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("archived")}
                  className={`pb-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    activeTab === "archived"
                      ? "border-b-2 border-amber-600 text-amber-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Archived Subjects
                </button>
              </div>

              <div className="rounded-2xl border border-gray-200">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  <span>Subject Library</span>
                  <span>Actions</span>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center gap-3 px-4 py-12 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading subjects...</span>
                  </div>
                ) : activeTab === "active" ? (
                  libraryFilteredSubjects.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {libraryFilteredSubjects.map((subject) => (
                        <div
                          key={subject.subject_id}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{subject.name}</p>
                            <p className="text-sm text-gray-500">
                              Assigned to {subject.grade_levels.length} grade level
                              {subject.grade_levels.length === 1 ? "" : "s"}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleArchiveSubject(subject)}
                            disabled={isSaving}
                            className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-12 text-center text-gray-500">
                      No active subjects match your search.
                    </div>
                  )
                ) : (
                  archivedFilteredSubjects.length > 0 ? (
                    <div className="divide-y divide-gray-200 bg-amber-50/30">
                      {archivedFilteredSubjects.map((subject) => (
                        <div
                          key={subject.subject_id}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{subject.name}</p>
                            <p className="text-sm text-gray-500">Archived</p>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleUnarchiveSubject(subject)}
                            disabled={isSaving}
                            className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            Unarchive
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-12 text-center text-gray-500">
                      No archived subjects match your search.
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white/95 p-5 shadow-xl sm:p-6">
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                Grade Level
              </label>
              <select
                value={selectedGradeLevelId ?? ""}
                onChange={(event) => setSelectedGradeLevelId(Number(event.target.value))}
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-900 outline-none transition focus:border-green-600"
              >
                {gradeLevels.map((gradeLevel) => (
                  <option key={gradeLevel.gl_id} value={gradeLevel.gl_id}>
                    {gradeLevel.grade_level}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4 rounded-2xl bg-[#f7f4df] px-4 py-3 text-sm text-gray-700">
              {selectedGradeLevel
                ? `${selectedGradeLevel.grade_level} templates will be created automatically for every new class in this grade level.`
                : "Choose a grade level to manage its predefined subjects."}
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {pendingAssignedSubjectIds.length > 0 || pendingUnassignedSubjectIds.length > 0
                  ? `${pendingAssignedSubjectIds.length} to assign, ${pendingUnassignedSubjectIds.length} to unassign`
                  : "Select subjects to assign or unassign in bulk."}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleUnassignSubjects}
                  disabled={isSaving || pendingUnassignedSubjectIds.length === 0}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Unassign Selected
                </Button>
                <Button
                  type="button"
                  onClick={handleAssignSubjects}
                  disabled={isSaving || pendingAssignedSubjectIds.length === 0}
                  className="bg-(--button-green) text-white hover:bg-green-700"
                >
                  Assign Selected
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 px-4 py-12 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading grade-level assignments...</span>
                </div>
              ) : subjects.length > 0 ? (
                subjects.map((subject) => {
                  const isAssigned = assignedSubjectIds.has(subject.subject_id);
                  const isPendingAssignment = pendingAssignedSubjectIdSet.has(subject.subject_id);
                  const isPendingUnassignment = pendingUnassignedSubjectIdSet.has(subject.subject_id);

                  return (
                    <div
                      key={subject.subject_id}
                      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
                        isPendingUnassignment
                          ? "border-red-200 bg-red-50"
                          : isAssigned
                          ? "border-green-200 bg-green-50"
                          : isPendingAssignment
                            ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{subject.name}</p>
                        <p className="text-sm text-gray-500">
                          {isAssigned
                            ? "Included in this grade level"
                            : isPendingAssignment
                              ? "Selected to be assigned"
                              : "Not assigned to this grade level"}
                        </p>
                      </div>

                      {isAssigned ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleTogglePendingUnassignment(subject.subject_id)}
                          disabled={isSaving || !selectedGradeLevelId}
                          className={
                            pendingUnassignedSubjectIdSet.has(subject.subject_id)
                              ? "border-red-300 bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100"
                          }
                        >
                          {pendingUnassignedSubjectIdSet.has(subject.subject_id) ? "Selected to Unassign" : "Select to Unassign"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleTogglePendingAssignment(subject.subject_id)}
                          disabled={isSaving || !selectedGradeLevelId}
                          className={
                            isPendingAssignment
                              ? "border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100"
                          }
                        >
                          {isPendingAssignment ? "Selected" : "Select"}
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-12 text-center text-gray-500">
                  Add subjects to the library first, then assign them here.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Modal
        isOpen={!!subjectToArchive}
        onClose={() => setSubjectToArchive(null)}
        title="Archive Subject"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4 rounded-xl bg-amber-50 p-4 text-amber-800">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Are you sure?</p>
              <p className="text-sm leading-relaxed">
                Archiving <span className="font-bold underline">{subjectToArchive?.name}</span> will hide it from the library and current grade level assignments. This action is safer than deleting, but will still impact availability.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setSubjectToArchive(null)}
              className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmArchive}
              disabled={isSaving}
              className="flex-1 h-12 bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Archive className="mr-2 h-5 w-5" />
                  Confirm Archive
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddSubjectConfirm}
        onClose={() => setShowAddSubjectConfirm(false)}
        title="Confirm New Subject"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4 rounded-xl bg-blue-50 p-4 text-blue-800">
            <div className="space-y-1">
              <p className="font-semibold">Add Subject</p>
              <p className="text-sm leading-relaxed">
                Are you sure you want to add <span className="font-bold underline">{newSubjectName.trim()}</span> to the subject library?
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddSubjectConfirm(false)}
              className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCreateSubject}
              disabled={isSaving}
              className="flex-1 h-12 bg-(--button-green) text-white hover:bg-green-700 shadow-lg shadow-green-200"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Add"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignSubjectConfirm}
        onClose={() => setShowAssignSubjectConfirm(false)}
        title="Confirm Assignment"
      >
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You are about to assign the following subjects to <span className="font-semibold">{selectedGradeLevel?.grade_level}</span>:
            </p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
              <ul className="list-inside list-disc text-sm text-gray-700">
                {pendingAssignedSubjectIds.map(id => {
                  const subject = subjects.find(s => s.subject_id === id);
                  return <li key={id} className="py-1">{subject?.name}</li>;
                })}
              </ul>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAssignSubjectConfirm(false)}
              className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAssignSubjects}
              disabled={isSaving}
              className="flex-1 h-12 bg-(--button-green) text-white hover:bg-green-700 shadow-lg shadow-green-200"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Assignment"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showUnassignSubjectConfirm}
        onClose={() => setShowUnassignSubjectConfirm(false)}
        title="Confirm Unassignment"
      >
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You are about to unassign the following subjects from <span className="font-semibold">{selectedGradeLevel?.grade_level}</span>:
            </p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
              <ul className="list-inside list-disc text-sm text-gray-700">
                {pendingUnassignedSubjectIds.map(id => {
                  const subject = subjects.find(s => s.subject_id === id);
                  return <li key={id} className="py-1">{subject?.name}</li>;
                })}
              </ul>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowUnassignSubjectConfirm(false)}
              className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnassignSubjects}
              disabled={isSaving}
              className="flex-1 h-12 bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Unassignment"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
