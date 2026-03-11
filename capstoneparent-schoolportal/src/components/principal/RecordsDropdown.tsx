export const RecordsDropdown = () => {
  return (
    <div className="absolute mt-2 w-48 bg-(--navbar-bg) border border-gray-200 rounded-md shadow-lg z-10">
      <a
        href="/manageclasslists"
        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
      >
        Manage Class Lists
      </a>
      <a
        href="/managesections"
        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
      >
        Manage Sections
      </a>
    </div>
  );
};