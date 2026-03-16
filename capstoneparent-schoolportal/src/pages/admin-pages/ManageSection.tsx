import {
  Search,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
} from "lucide-react";
import { useState, useMemo } from "react";
import { NavbarAdmin } from "../../components/admin/NavbarAdmin";
import { Button } from "../../components/ui/button";
import { SectionFormModal } from "../../components/admin/SectionFormModal";
import { SectionDeleteModal } from "../../components/admin/SectionDeleteModal";

interface Section {
  id: number;
  name: string;
}

export const ManageSection = () => {
  // Temporary local state until API integration is added.
  const [sections, setSections] = useState<Section[]>([
    { id: 1, name: "Section A" },
    { id: 2, name: "Section B" },
    { id: 3, name: "Section C" },
    { id: 4, name: "Section D" },
  ]);

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
      section.name.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const handleAddSection = () => {
    if (!formData.name.trim()) return;

    const newSection: Section = {
      id: Math.max(...sections.map((s) => s.id), 0) + 1,
      name: formData.name,
    };

    setSections([...sections, newSection]);
    setFormData({ name: "" });
    setIsAddModalOpen(false);
  };

  const handleEditClick = (section: Section) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSection = () => {
    if (!editingSection || !formData.name.trim()) {
      return;
    }

    setSections(
      sections.map((section) =>
        section.id === editingSection.id
          ? {
              ...section,
              name: formData.name,
            }
          : section,
      ),
    );

    setFormData({ name: "" });
    setEditingSection(null);
    setIsEditModalOpen(false);
  };

  const handleDeleteClick = (section: Section) => {
    setDeletingSection(section);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSection = () => {
    if (!deletingSection) return;

    setSections(sections.filter((section) => section.id !== deletingSection.id));
    setDeletingSection(null);
    setIsDeleteModalOpen(false);
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
                placeholder="Search section or adviser..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-800 placeholder:text-gray-400 focus:border-(--button-green) focus:outline-none"
              />
            </div>

            <Button
              className="hidden bg-(--button-green) text-white hover:bg-(--button-hover-green) sm:inline-flex"
              onClick={openAddSectionModal}
            >
              <Plus className="h-4 w-4" />
              Add Section
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleSort("name")}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                sortField === "name"
                  ? "border-(--button-green) bg-(--button-green) text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-(--button-green) hover:text-(--button-green)"
              }`}
            >
              Section Name
              {getSortIcon("name")}
            </button>
          </div>

          <div className="mt-5">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-gray-500">
                No sections found.
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredSections.map((section) => (
                  <li
                    key={section.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 transition hover:border-(--button-green) hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {section.name}
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
      />

      <SectionDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingSection(null);
        }}
        onConfirm={handleDeleteSection}
        sectionName={deletingSection?.name}
      />
    </div>
  );
};
