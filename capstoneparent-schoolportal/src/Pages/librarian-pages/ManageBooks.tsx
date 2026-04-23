import { NavbarLibrarian } from "@/components/librarian/NavbarLibrarian";
import AddBookModal from "@/components/librarian/AddBookModal";
import EditBookModal from "@/components/librarian/EditBookModal";
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
import type { LearningMaterial, LibraryCategory, LibrarySubject } from "@/lib/api/types";
import { formatGradeLevel, GRADE_LEVELS, getBadgeColorsForString } from "@/lib/libraryHelpers";
import { Loader } from "@/components/ui/Loader";

export const ManageBooks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [isBookCopyModalOpen, setIsBookCopyModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [books, setBooks] = useState<LearningMaterial[]>([]);
  const [subjects, setSubjects] = useState<LibrarySubject[]>([]);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = async () => {
    const response = await libraryApi.getAllMaterials({
      item_type: "Book",
      limit: 1000,
    });
    setBooks(response.data);
  };

  const loadPageData = async () => {
    setLoading(true);
    try {
      const [booksResponse, subjectsResponse, categoriesResponse] = await Promise.all([
        libraryApi.getAllMaterials({ item_type: "Book", limit: 1000 }),
        libraryApi.getAllSubjects(),
        libraryApi.getAllCategories(),
      ]);
      setBooks(booksResponse.data);
      setSubjects(subjectsResponse.data);
      setCategories(categoriesResponse.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      subjectFilter === "all" || book.subject_id?.toString() === subjectFilter;
    const matchesGrade =
      gradeFilter === "all" || book.gl_id.toString() === gradeFilter;
    return matchesSearch && matchesSubject && matchesGrade;
  });
  const hasActiveFilters =
    searchQuery.trim() !== "" || subjectFilter !== "all" || gradeFilter !== "all";

  const handleAddBooks = async (newBook: {
    title: string;
    author: string;
    subject_id: number;
    gl_id: number;
  }) => {
    const defaultBookCategoryId =
      categories.find((category) =>
        ["books", "book", "textbooks", "textbook"].includes(
          category.category_name.trim().toLowerCase(),
        ),
      )?.category_id ?? categories[0]?.category_id;

    if (!defaultBookCategoryId) {
      throw new Error("Create at least one category before adding books.");
    }

    await libraryApi.createMaterial({
      item_name: newBook.title,
      author: newBook.author,
      item_type: "Book",
      category_id: defaultBookCategoryId,
      subject_id: newBook.subject_id,
      gl_id: newBook.gl_id,
    });
    await loadBooks();
  };

  const selectedBook = books.find((book) => book.item_id === selectedBookId);

  const handleOpenEditBookModal = (bookId: number) => {
    setSelectedBookId(bookId);
    setIsEditBookModalOpen(true);
  };

  const handleCloseEditBookModal = () => {
    setIsEditBookModalOpen(false);
    setSelectedBookId(null);
  };

  const handleSaveEditedBook = async (updatedBook: {
    title: string;
    author: string;
    subject_id: number;
    gl_id: number;
  }) => {
    if (!selectedBookId) return;
    await libraryApi.updateMaterial(selectedBookId, {
      item_name: updatedBook.title,
      author: updatedBook.author,
      subject_id: updatedBook.subject_id,
      gl_id: updatedBook.gl_id,
    });
    await loadBooks();
  };

  const handleMaterialUpdated = async (updatedMaterial: LearningMaterial) => {
    setBooks((current) =>
      current.map((book) =>
        book.item_id === updatedMaterial.item_id ? updatedMaterial : book,
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
              <h1 className="text-3xl font-bold">Manage Books</h1>
              <Button
                className="bg-(--button-green) px-6 py-2 text-white hover:bg-(--button-hover-green)"
                onClick={() => setIsAddBookModalOpen(true)}
              >
                Add Book
              </Button>
            </div>

            <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search book..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="rounded-md border border-gray-300 py-2 pl-10 pr-4 focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem
                        key={subject.subject_id}
                        value={subject.subject_id.toString()}
                      >
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Grade Level" />
                  </SelectTrigger>
                  <SelectContent>
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
                      setSubjectFilter("all");
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
                filteredBooks.map((book) => (
                  <div
                    key={book.item_id}
                    className="cursor-pointer border-b border-gray-200 px-4 py-4 last:border-b-0 hover:bg-gray-50"
                    onClick={() => {
                      setSelectedBookId(book.item_id);
                      setIsBookCopyModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">{book.item_name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeColorsForString(book.subject?.name ?? "No Subject")}`}>
                          {book.subject?.name ?? "No Subject"}
                        </span>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getBadgeColorsForString(formatGradeLevel(book.gl_id))}`}>
                          {formatGradeLevel(book.gl_id)}
                        </span>
                        <Pencil
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenEditBookModal(book.item_id);
                          }}
                          className="cursor-pointer text-(--button-green) hover:text-(--button-hover-green)"
                          size={18}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!loading && filteredBooks.length === 0 && (
                <p className="py-8 text-center text-gray-500">No books found.</p>
              )}
            </section>
          </div>
        </main>
      </div>

      {isAddBookModalOpen && (
        <AddBookModal
          onClose={() => setIsAddBookModalOpen(false)}
          onAdd={handleAddBooks}
          subjects={subjects}
        />
      )}

      {isEditBookModalOpen && selectedBook && (
        <EditBookModal
          onClose={handleCloseEditBookModal}
          onSave={handleSaveEditedBook}
          subjects={subjects}
          initialBook={{
            title: selectedBook.item_name,
            author: selectedBook.author || "",
            subject_id: selectedBook.subject_id ?? undefined,
            gl_id: selectedBook.gl_id,
          }}
        />
      )}

      {isBookCopyModalOpen && selectedBook && (
        <BookCopyModal
          material={selectedBook}
          onMaterialUpdated={handleMaterialUpdated}
          onClose={() => {
            setIsBookCopyModalOpen(false);
            setSelectedBookId(null);
          }}
        />
      )}
    </>
  );
};
