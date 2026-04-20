import { AboutChildNavbar } from "@/components/parent/AboutChildNavbar";
import { NavbarParent } from "@/components/parent/NavbarParent";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParentStore } from "@/lib/store/parentStore";
import { parentsApi } from "@/lib/api/parentsApi";
import { useNavigate } from "react-router-dom";

export const QuarterlyGrades = () => {
  const navigate = useNavigate();
  const { activeChild, children, setActiveChild } = useParentStore();
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!activeChild) {
      navigate("/parentview");
      return;
    }

    const fetchAcademicData = async () => {
      setLoading(true);
      try {
        const [gradesRes, attendanceRes] = await Promise.all([
          parentsApi.getChildGrades(activeChild.student_id),
          parentsApi.getChildAttendance(activeChild.student_id),
        ]);
        setGrades(gradesRes.data);
        setAttendance(attendanceRes.data);
      } catch (err) {
        console.error("Failed to fetch academic data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicData();
  }, [activeChild, navigate]);

  const otherChildren = children.filter(
    (child) => child.student_id !== activeChild?.student_id && (child.status === "VERIFIED" || child.status === "ENROLLED")
  );

  const handleSelectChild = (child: any) => {
    setActiveChild(child);
    setIsDropdownOpen(false);
  };

  const gradingScale = [
    { description: "Outstanding", scale: "90 - 100", remarks: "Passed" },
    { description: "Very Satisfactory", scale: "85 - 89", remarks: "Passed" },
    { description: "Satisfactory", scale: "80 - 84", remarks: "Passed" },
    { description: "Fairly Satisfactory", scale: "75 - 79", remarks: "Passed" },
    { description: "Did Not Meet Expectations", scale: "Below 75", remarks: "Failed" },
  ];

  if (!activeChild) return null;

  // Calculate General Average
  const generalAverage = grades.length > 0 
    ? (grades.reduce((sum, g) => sum + (g.avg_grade || 0), 0) / grades.length).toFixed(2)
    : "-";

  const attendanceMonths = [
    "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
  ];

  const getAttendanceForMonth = (monthName: string, type: "school_days" | "days_present" | "days_absent") => {
    const record = attendance.find(a => a.month === monthName);
    return record ? record[type] : "";
  };

  const calculateTotalAttendance = (type: "school_days" | "days_present" | "days_absent") => {
    return attendance.reduce((sum, a) => sum + (a[type] || 0), 0);
  };

  return (
    <div className="min-h-screen bg-white">
      <NavbarParent />
      <AboutChildNavbar activeTab="quarterly-grades" />

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

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-16 w-16 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quarterly Grades */}
            <section className="rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Quarterly Grades</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-2 py-2 text-base font-semibold">Learning Areas</th>
                      <th className="border border-gray-400 px-2 py-2 font-semibold">Q1</th>
                      <th className="border border-gray-400 px-2 py-2 font-semibold">Q2</th>
                      <th className="border border-gray-400 px-2 py-2 font-semibold">Q3</th>
                      <th className="border border-gray-400 px-2 py-2 font-semibold">Q4</th>
                      <th className="border border-gray-400 px-2 py-2 font-semibold">Final Grade</th>
                      <th className="border border-gray-400 px-2 py-2 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.length > 0 ? (
                      grades.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-400 px-2 py-2 text-left">{row.subject_record?.subject?.name || row.subject_record?.subject_name}</td>
                          <td className="border border-gray-400 px-2 py-2">{row.q1_grade || "-"}</td>
                          <td className="border border-gray-400 px-2 py-2">{row.q2_grade || "-"}</td>
                          <td className="border border-gray-400 px-2 py-2">{row.q3_grade || "-"}</td>
                          <td className="border border-gray-400 px-2 py-2">{row.q4_grade || "-"}</td>
                          <td className="border border-gray-400 px-2 py-2 font-semibold">{row.avg_grade || "-"}</td>
                          <td className="border border-gray-400 px-2 py-2 font-semibold">{row.remarks || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="border border-gray-400 px-2 py-8 text-center text-gray-500">
                          No grade records found.
                        </td>
                      </tr>
                    )}
                    {grades.length > 0 && (
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-gray-400 px-2 py-2 text-left">General Average</td>
                        <td className="border border-gray-400 px-2 py-2" colSpan={4}></td>
                        <td className="border border-gray-400 px-2 py-2">{generalAverage}</td>
                        <td className="border border-gray-400 px-2 py-2">
                          {Number(generalAverage) >= 75 ? "PASSED" : Number(generalAverage) > 0 ? "FAILED" : "-"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Attendance Records */}
            <section className="rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Attendance Records</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-1 py-2 font-semibold">Months</th>
                      {attendanceMonths.map(m => (
                        <th key={m} className="border border-gray-400 px-1 py-2 font-semibold text-[10px] sm:text-xs">{m}</th>
                      ))}
                      <th className="border border-gray-400 px-1 py-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-1 py-2 text-left font-semibold">School Days</td>
                      {attendanceMonths.map(m => (
                        <td key={m} className="border border-gray-400 px-1 py-2">{getAttendanceForMonth(m, "school_days")}</td>
                      ))}
                      <td className="border border-gray-400 px-1 py-2 font-semibold">{calculateTotalAttendance("school_days")}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1 py-2 text-left font-semibold">Days Present</td>
                      {attendanceMonths.map(m => (
                        <td key={m} className="border border-gray-400 px-1 py-2">{getAttendanceForMonth(m, "days_present")}</td>
                      ))}
                      <td className="border border-gray-400 px-1 py-2 font-semibold">{calculateTotalAttendance("days_present")}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1 py-2 text-left font-semibold">Times Absent</td>
                      {attendanceMonths.map(m => (
                        <td key={m} className="border border-gray-400 px-1 py-2">{getAttendanceForMonth(m, "days_absent")}</td>
                      ))}
                      <td className="border border-gray-400 px-1 py-2 font-semibold">{calculateTotalAttendance("days_absent")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-gray-500 italic">Attendance records are updated by the class adviser monthly.</p>
            </section>
          </div>
        )}

        {/* Grading Scale & Remarks */}
        <section className="mt-6 rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Grading Scale & Remarks</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-4 py-3 text-base font-semibold">Description</th>
                  <th className="border border-gray-400 px-4 py-3 text-base font-semibold">Grading Scale</th>
                  <th className="border border-gray-400 px-4 py-3 text-base font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {gradingScale.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-400 px-4 py-3 text-left">{row.description}</td>
                    <td className="border border-gray-400 px-4 py-3">{row.scale}</td>
                    <td className="border border-gray-400 px-4 py-3 font-semibold">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};
