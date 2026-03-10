import { NavbarLibrarian } from "@/components/librarian/NavbarLibrarian";
import BorrowedCopyModal from "@/components/librarian/BorrowedCopyModal";

export const BorrowedResources = () => {
  return (
    <div className="min-h-screen bg-white">
      <NavbarLibrarian />
      <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-10 sm:py-12">
        <BorrowedCopyModal />
      </main>
    </div>
  );
};
