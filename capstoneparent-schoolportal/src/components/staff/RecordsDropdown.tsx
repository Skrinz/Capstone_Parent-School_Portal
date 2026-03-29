import { Link } from "react-router-dom";

export const RecordsDropdown = () => {
  return (
    <div className="absolute z-10 mt-2 w-48 rounded-md border border-gray-200 bg-(--navbar-bg) shadow-lg">
      <Link
        to="/staffview"
        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
      >
        Staff Dashboard
      </Link>
    </div>
  );
};
