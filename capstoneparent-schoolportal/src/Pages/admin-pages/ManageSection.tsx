import {
  Search,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { NavbarAdmin } from "../../components/admin/NavbarAdmin";
import { Button } from "../../components/ui/button";
import { SectionFormModal } from "../../components/admin/SectionFormModal";
import { SectionDeleteModal } from "../../components/admin/SectionDeleteModal";
import { classesApi, type Section } from "../../lib/api/classesApi";

export const ManageSection = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Section | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [formData, setFormData] = useState({
    name: "",
  });

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);

  const fetchSections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await classesApi.getSections();
      setSections(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSort = (field: keyof Section) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const filteredSections = useMemo(() => {
    let filtered = sections.filter((section) =>
      section.section_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return filtered;
  }, [sections, searchQuery, sortField, sortDirection]);

  const validateFormat = (name: string) => {
    const regex = /^Section .+$/i;
    if (!regex.test(name)) {
      return "Format must be 'Section [Name]' (e.g., Section A)";
    }
    return null;
  };

  const handleAddSection = async () => {
    if (!formData.name.trim()) return;

    const formatError = validateFormat(formData.name);
    if (formatError) {
      alert(formatError);
      return;
    }

    try {
      await classesApi.createSection(formData.name);
      setFormData({ name: "" });
      setIsAddModalOpen(false);
      fetchSections();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add section");
    }
  };

  const handleEditClick = (section: Section) => {
    setEditingSection(section);
    setFormData({
      name: section.section_name,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSection = async () => {
    if (!editingSection || !formData.name.trim()) {
      return;
    }

    const formatError = validateFormat(formData.name);
    if (formatError) {
      alert(formatError);
      return;
    }

    try {
      await classesApi.updateSection(editingSection.section_id, formData.name);
      setFormData({ name: "" });
      setEditingSection(null);
      setIsEditModalOpen(false);
      fetchSections();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update section");
    }
  };

  const handleDeleteClick = (section: Section) => {
    setDeletingSection(section);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSection = async () => {
    if (!deletingSection) return;

    try {
      await classesApi.deleteSection(deletingSection.section_id);
      setDeletingSection(null);
      setIsDeleteModalOpen(false);
      fetchSections();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete section");
    }
  };

  const openAddSectionModal = () => {
    setFormData({ name: "" });
    setIsAddModalOpen(true);
  };

  const getSortIcon = (field: keyof Section) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }

    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const editFormHasChanges = editingSection
    ? formData.name.trim() !== editingSection.section_name.trim()
    : false;

  return (
    <div className="min-h-screen bg-[#efefef]">
      <NavbarAdmin />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:pt-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Manage Sections
          </h1>
        </div>

        <section className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-(--button-green) focus:outline-none"
              />
            </div>

            <Button
              className="hidden bg-(--button-green) text-white hover:bg-(--button-hover-green) sm:inline-flex"
              onClick={openAddSectionModal}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              Add Section
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleSort("section_name")}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                sortField === "section_name"
                  ? "border-(--button-green) bg-(--button-green) text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-(--button-green) hover:text-(--button-green)"
              }`}
            >
              Section Name
              {getSortIcon("section_name")}
            </button>
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin text-(--button-green) mb-2" />
                <p>Loading sections...</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-red-600">
                <p>{error}</p>
                <button
                  onClick={fetchSections}
                  className="mt-2 text-sm font-semibold underline hover:text-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-gray-500">
                No sections found.
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredSections.map((section) => (
                  <li
                    key={section.section_id}
                    className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 transition hover:border-(--button-green) hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {section.section_name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleEditClick(section)}
                          className="rounded-lg p-2 text-(--button-green) transition-colors hover:bg-green-50 hover:text-(--button-hover-green)"
                          aria-label="Edit section"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(section)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                          aria-label="Delete section"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <SectionFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormData({ name: "" });
        }}
        onSubmit={handleAddSection}
        title="Add Section"
        submitLabel="Add"
        formData={formData}
        setFormData={setFormData}
      />

      <SectionFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSection(null);
          setFormData({ name: "" });
        }}
        onSubmit={handleUpdateSection}
        title="Edit Section"
        submitLabel="Update"
        formData={formData}
        setFormData={setFormData}
        disableSubmit={!editFormHasChanges}
      />

      <SectionDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingSection(null);
        }}
        onConfirm={handleDeleteSection}
        sectionName={deletingSection?.section_name}
      />
    </div>
  );
};
