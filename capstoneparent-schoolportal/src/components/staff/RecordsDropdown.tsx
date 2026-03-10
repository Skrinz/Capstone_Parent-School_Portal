import { Link } from "react-router-dom";

export const RecordsDropdown = () => {
  return (
    <div className="absolute mt-2 w-48 bg-(--navbar-bg) border border-gray-200 rounded-md shadow-lg z-10">
      <Link
        to="/generalannouncement"
        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
      >
        General Announcements
      </Link>
      <Link
        to="/staffannouncement"
        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
      >
        Staff Announcements
      </Link>
      <Link
        to="/memorandumannouncement"
        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
      >
        Memorandums
      </Link>
      <Link
        to="/staffview"
        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
      >
        Staff Dashboard
      </Link>
    </div>
  );
};