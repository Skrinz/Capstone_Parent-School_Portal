import { NavbarLibrarian } from "@/components/librarian/NavbarLibrarian";
import AddCategoryModal from "@/components/librarian/AddCategoryModal";
import EditCategoryModal from "@/components/librarian/EditCategoryModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Loader } from "@/components/ui/Loader";

export const ManageCategories = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const categories = useLibraryStore((state) => state.categories);
  const fetchCategories = useLibraryStore((state) => state.fetchCategories);
  const createCategory = useLibraryStore((state) => state.createCategory);
  const updateCategory = useLibraryStore((state) => state.updateCategory);
  const loading = useLibraryStore((state) => state.loading);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (newCategory: string) => {
    await createCategory(newCategory);
    setShowAddCategoryModal(false);
  };

  const selectedCategory = categories.find((category) => category.category_id === editingCategoryId) ?? null;

  const handleEditCategory = async (updatedCategoryName: string) => {
    if (!editingCategoryId) return;
    await updateCategory(editingCategoryId, updatedCategoryName);
    setEditingCategoryId(null);
  };

  const filtered = categories.filter((c) =>
    c.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const hasActiveFilters = searchQuery.trim() !== "";

  return (
    <div className="min-h-screen">
      <NavbarLibrarian />
      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold">Manage Categories</h1>
            <button
              className="rounded-md bg-(--button-green) px-4 py-2 text-white font-semibold hover:bg-(--button-hover-green) transition-colors"
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
            >
              Add Category
            </button>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="flex gap-2">
              <Input
                placeholder="Search category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-2 text-center focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              {hasActiveFilters ? (
                <Button
                  type="button"
                  className="bg-(--status-inactive) text-white hover:brightness-110"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
            <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                  <Loader />
                ) : (
                  filtered.map((c) => (
                    <div
                      key={c.category_id}
                      className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0"
                    >
                      <span className="min-w-32 text-left">{c.category_name}</span>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(c.category_id)}
                        className="text-(--button-green) hover:text-(--button-hover-green)"
                      >
                        <Pencil size={18} />
                      </button>
                    </div>
                  ))
                )}
                {!loading && filtered.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No categories found.
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>

      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onAdd={handleAddCategory}
        />
      )}

      {selectedCategory && (
        <EditCategoryModal
          onClose={() => setEditingCategoryId(null)}
          onEdit={handleEditCategory}
          initialCategoryName={selectedCategory.category_name}
        />
      )}
    </div>
  );
};

