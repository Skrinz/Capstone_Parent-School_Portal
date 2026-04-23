import { AboutChildNavbar } from "@/components/parent/AboutChildNavbar";
import { NavbarParent } from "@/components/parent/NavbarParent";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParentStore } from "@/lib/store/parentStore";
import { parentsApi } from "@/lib/api/parentsApi";
import { useNavigate } from "react-router-dom";

export const LibraryRecords = () => {
  const navigate = useNavigate();
  const { activeChild, children, setActiveChild } = useParentStore();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<any>({ page: 1, limit: 10, total: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!activeChild) {
      navigate("/parentview");
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await parentsApi.getChildLibraryRecords(activeChild.student_id, {
          page: pagination.page,
          limit: pagination.limit
        });
        setRecords(res.data);
        if (res.pagination) setPagination((prev: any) => ({ ...prev, ...res.pagination }));
      } catch (err) {
        console.error("Failed to fetch library records", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [activeChild, navigate, pagination.page]);

  const otherChildren = children.filter(
    (child) => child.student_id !== activeChild?.student_id && (child.status === "VERIFIED" || child.status === "ENROLLED")
  );

  const handleSelectChild = (child: any) => {
    setActiveChild(child);
    setIsDropdownOpen(false);
  };

  const filteredRecords = records.filter((rec) => {
    const matchesSearch = rec.copy?.item?.item_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const status = rec.returned_at ? "RETURNED" : (new Date(rec.due_at) < new Date() ? "OVERDUE" : "BORROWED");
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const hasActiveFilters =
    searchQuery.trim() !== "" || statusFilter !== "all";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "BORROWED": return "bg-green-500 text-white";
      case "RETURNED": return "bg-blue-500 text-white";
      case "OVERDUE": return "bg-red-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  if (!activeChild) return null;

  const totalFines = records.reduce((sum, rec) => sum + Number(rec.penalty_cost || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <NavbarParent />
      <AboutChildNavbar activeTab="library-records" />

      <main className="mx-auto max-w-7xl px-6 pb-12 pt-6">
        {/* Student Information */}
        <section className="mb-6 rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Student Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <p className="text-lg">
                <span className="font-semibold">Student Name:</span> {activeChild.fname} {activeChild.lname}
              </p>
              <p className="text-lg">
                <span className="font-semibold">LRN:</span> {activeChild.lrn_number}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-lg">
                <span className="font-semibold">Grade Level & Section:</span>{" "}
                {activeChild.grade_level?.grade_level} - {activeChild.section?.section_name || "N/A"}
              </p>
              <p className="text-lg">
                <span className="font-semibold">School Year:</span> {activeChild.syear_start} - {activeChild.syear_end}
              </p>
            </div>
          </div>
          {otherChildren.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg border border-gray-400 bg-white px-4 py-2 text-lg font-medium transition-colors hover:bg-gray-50"
                >
                  Switch to another child
                  <ChevronDown className={`h-5 w-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-300 bg-white shadow-lg z-10">
                    {otherChildren.map((child: any) => (
                      <button
                        key={child.student_id}
                        type="button"
                        onClick={() => handleSelectChild(child)}
                        className="block w-full px-4 py-3 text-left text-lg hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {child.fname} {child.lname}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Library Transactions</h2>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search book title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-green-600 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-green-600 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="BORROWED">Borrowed</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="RETURNED">Returned</option>
                </select>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600"
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-green-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-3 py-3 font-semibold">Book Title</th>
                      <th className="border border-gray-400 px-3 py-3 font-semibold">Borrowed</th>
                      <th className="border border-gray-400 px-3 py-3 font-semibold">Due Date</th>
                      <th className="border border-gray-400 px-3 py-3 font-semibold">Status</th>
                      <th className="border border-gray-400 px-3 py-3 text-center font-semibold">Fines</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((rec) => {
                      const status = rec.returned_at ? "RETURNED" : (new Date(rec.due_at) < new Date() ? "OVERDUE" : "BORROWED");
                      return (
                        <tr key={rec.mbr_id} className="hover:bg-gray-50">
                          <td className="border border-gray-400 px-3 py-3">
                            <p className="font-medium">{rec.copy?.item?.item_name}</p>
                            <p className="text-xs text-gray-500">Copy: {rec.copy?.copy_code}</p>
                          </td>
                          <td className="border border-gray-400 px-3 py-3">{formatDate(rec.borrowed_at)}</td>
                          <td className="border border-gray-400 px-3 py-3">{formatDate(rec.due_at)}</td>
                          <td className="border border-gray-400 px-3 py-3">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(status)}`}>
                              {status}
                            </span>
                          </td>
                          <td className="border border-gray-400 px-3 py-3 text-center">
                            {Number(rec.penalty_cost) > 0 ? `₱ ${Number(rec.penalty_cost).toFixed(2)}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm self-start">
            <h2 className="mb-4 text-xl font-bold">Account Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Total Borrowed</span>
                <span className="font-bold">{pagination.total}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-600">Total Fines</span>
                <span className="font-bold text-red-600">₱ {totalFines.toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
