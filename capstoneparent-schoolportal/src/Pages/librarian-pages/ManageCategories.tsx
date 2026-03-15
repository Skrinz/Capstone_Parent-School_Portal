import { NavbarLibrarian } from "@/components/librarian/NavbarLibrarian";
import AddCategoryModal from "@/components/librarian/AddCategoryModal";
import EditCategoryModal from "@/components/librarian/EditCategoryModal";
import { Input } from "@/components/ui/input";
import {
  addLibraryCategory,
  deleteLibraryCategory,
  getLibraryCategories,
  subscribeLibraryCategories,
  updateLibraryCategory,
} from "@/lib/libraryCategories";
import { useEffect, useState } from "react";

export const ManageCategories = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(() => getLibraryCategories());

  useEffect(() => {
    setCategories(getLibraryCategories());
    return subscribeLibraryCategories(() => setCategories(getLibraryCategories()));
  }, []);

  const handleAddCategory = (newCategory: string) => {
    addLibraryCategory(newCategory);
  };

  const openEditCategoryModal = (categoryName: string) => {
    setEditingCategory(categoryName);
    setShowEditCategoryModal(true);
  };

  const closeEditCategoryModal = () => {
    setShowEditCategoryModal(false);
    setEditingCategory(null);
  };

  const handleEditCategory = (updatedCategory: string) => {
    if (!editingCategory) {
      return;
    }

    updateLibraryCategory(editingCategory, updatedCategory);

    closeEditCategoryModal();
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    deleteLibraryCategory(categoryToDelete);

    if (editingCategory === categoryToDelete) {
      closeEditCategoryModal();
    }
  };

  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Input
              placeholder="Search category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 text-center focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                {filtered.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0"
                  >
                    <span className="min-w-32 text-left">{c}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditCategoryModal(c)}
                        className="rounded-md bg-(--button-green) px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-(--button-hover-green)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
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

      {showEditCategoryModal && editingCategory && (
        <EditCategoryModal
          onClose={closeEditCategoryModal}
          onEdit={handleEditCategory}
          initialCategoryName={editingCategory}
        />
      )}
    </div>
  );
};
