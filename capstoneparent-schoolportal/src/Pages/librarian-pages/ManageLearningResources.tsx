import { NavbarLibrarian } from "@/components/librarian/NavbarLibrarian";
import AddLearningResourceModal from "@/components/librarian/AddLearningResourceModal";
import EditLearningResourceModal from "@/components/librarian/EditLearningResourceModal";
import BookCopyModal from "@/components/librarian/BookCopyModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { libraryApi } from "@/lib/api/libraryApi";
import type { LearningMaterial, LibraryCategory } from "@/lib/api/types";
import { formatGradeLevel, GRADE_LEVELS, getBadgeColorsForString } from "@/lib/libraryHelpers";
import { Loader } from "@/components/ui/Loader";

export const ManageLearningResources = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [isAddLearningResourceModalOpen, setIsAddLearningResourceModalOpen] = useState(false);
  const [isEditLearningResourceModalOpen, setIsEditLearningResourceModalOpen] = useState(false);
  const [isLearningResourceCopyModalOpen, setIsLearningResourceCopyModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [resources, setResources] = useState<LearningMaterial[]>([]);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadResources = async () => {
    const response = await libraryApi.getAllMaterials({
      item_type: "Learning_Resource",
      limit: 1000,
    });
    setResources(response.data);
  };

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [resourcesResponse, categoriesResponse] = await Promise.all([
        libraryApi.getAllMaterials({
          item_type: "Learning_Resource",
          limit: 1000,
        }),
        libraryApi.getAllCategories(),
      ]);
      setResources(resourcesResponse.data);
      setCategories(categoriesResponse.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || resource.category_id.toString() === categoryFilter;
    const matchesGrade =
      gradeFilter === "all" || resource.gl_id.toString() === gradeFilter;
    return matchesSearch && matchesCategory && matchesGrade;
  });
  const hasActiveFilters =
    searchQuery.trim() !== "" || categoryFilter !== "all" || gradeFilter !== "all";

  const handleAddResources = async (newResource: {
    title: string;
    category_id: number;
    gl_id: number;
  }) => {
    await libraryApi.createMaterial({
      item_name: newResource.title,
      category_id: newResource.category_id,
      gl_id: newResource.gl_id,
      item_type: "Learning_Resource",
    });
    await loadResources();
  };

  const selectedResource = resources.find(
    (resource) => resource.item_id === selectedResourceId,
  );

  const handleOpenEditLearningResourceModal = (resourceId: number) => {
    setSelectedResourceId(resourceId);
    setIsEditLearningResourceModalOpen(true);
  };

  const handleCloseEditLearningResourceModal = () => {
    setIsEditLearningResourceModalOpen(false);
    setSelectedResourceId(null);
  };

  const handleSaveEditedResource = async (updatedResource: {
    title: string;
    category_id: number;
    gl_id: number;
  }) => {
    if (!selectedResourceId) return;
    await libraryApi.updateMaterial(selectedResourceId, {
      item_name: updatedResource.title,
      category_id: updatedResource.category_id,
      gl_id: updatedResource.gl_id,
    });
    await loadResources();
  };

  const handleMaterialUpdated = async (updatedMaterial: LearningMaterial) => {
    setResources((current) =>
      current.map((resource) =>
        resource.item_id === updatedMaterial.item_id ? updatedMaterial : resource,
      ),
    );
  };

  return (
    <>
      <div className="min-h-screen">
        <NavbarLibrarian />
        <main className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold">Manage Learning Resources</h1>
              <Button
                className="bg-(--button-green) px-6 py-2 text-white hover:bg-(--button-hover-green)"
                onClick={() => setIsAddLearningResourceModalOpen(true)}
              >
                Add Item
              </Button>
            </div>

            <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search item..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="rounded-md border border-gray-300 py-2 pl-10 pr-4 focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.category_id}
                        value={category.category_id.toString()}
                      >
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Grade Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All</SelectItem>
                    {GRADE_LEVELS.map((grade) => (
                      <SelectItem key={grade.id.toString()} value={grade.id.toString()}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    className="bg-(--status-inactive) text-white hover:brightness-110"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                      setGradeFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              {loading ? (
                <Loader />
              ) : (
                filteredResources.map((resource) => (
                  <div
                    key={resource.item_id}
                    className="cursor-pointer border-b border-gray-200 px-4 py-4 last:border-b-0 hover:bg-gray-50"
                    onClick={() => {
                      setSelectedResourceId(resource.item_id);
                      setIsLearningResourceCopyModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">{resource.item_name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeColorsForString(resource.category?.category_name ?? "No Category")}`}>
                          {resource.category?.category_name}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeColorsForString(formatGradeLevel(resource.gl_id))}`}>
                          {formatGradeLevel(resource.gl_id)}
                        </span>
                        <Pencil
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenEditLearningResourceModal(resource.item_id);
                          }}
                          className="cursor-pointer text-(--button-green) hover:text-(--button-hover-green)"
                          size={18}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!loading && filteredResources.length === 0 && (
                <p className="py-8 text-center text-gray-500">No items found.</p>
              )}
            </section>
          </div>
        </main>
      </div>

      {isAddLearningResourceModalOpen && (
        <AddLearningResourceModal
          onClose={() => setIsAddLearningResourceModalOpen(false)}
          onAdd={handleAddResources}
          categories={categories}
        />
      )}

      {isEditLearningResourceModalOpen && selectedResource && (
        <EditLearningResourceModal
          onClose={handleCloseEditLearningResourceModal}
          onSave={handleSaveEditedResource}
          categories={categories}
          initialResource={{
            title: selectedResource.item_name,
            category_id: selectedResource.category_id,
            gl_id: selectedResource.gl_id,
          }}
        />
      )}

      {isLearningResourceCopyModalOpen && selectedResource && (
        <BookCopyModal
          material={selectedResource}
          onMaterialUpdated={handleMaterialUpdated}
          onClose={() => {
            setIsLearningResourceCopyModalOpen(false);
            setSelectedResourceId(null);
          }}
        />
      )}
    </>
  );
};
