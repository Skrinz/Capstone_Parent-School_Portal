import { AboutChildNavbar } from "@/components/parent/AboutChildNavbar";
import { NavbarParent } from "@/components/parent/NavbarParent";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParentStore } from "@/lib/store/parentStore";
import { parentsApi } from "@/lib/api/parentsApi";
import { useNavigate } from "react-router-dom";

export const ClassSchedule = () => {
  const navigate = useNavigate();
  const { activeChild, children, setActiveChild } = useParentStore();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!activeChild) {
      navigate("/parentview");
      return;
    }

    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await parentsApi.getChildSchedule(activeChild.student_id);
        setSchedule(res.data);
      } catch (err) {
        console.error("Failed to fetch schedule", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [activeChild, navigate]);

  const otherChildren = children.filter(
    (child) => child.student_id !== activeChild?.student_id && (child.status === "VERIFIED" || child.status === "ENROLLED")
  );

  const handleSelectChild = (child: any) => {
    setActiveChild(child);
    setIsDropdownOpen(false);
  };
  if (!activeChild) return null;

  return (
    <div className="min-h-screen bg-white">
      <NavbarParent />
      <AboutChildNavbar activeTab="class-schedule" />

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
                {activeChild.grade_level?.grade_level} - {schedule?.section?.section_name || activeChild.section?.section_name || "N/A"}
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

        {/* Class Schedule */}
        <section className="rounded-xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Class Schedule</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {schedule?.class_sched ? (
                <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-inner">
                  <div className="relative group mx-auto max-w-4xl">
                    <img 
                      src={schedule.class_sched} 
                      alt={`Class Schedule - ${activeChild.fname} ${activeChild.lname}`} 
                      className="mx-auto block max-h-[800px] w-auto rounded-lg border border-gray-300 bg-white shadow-lg transition-transform duration-300 hover:scale-[1.01] object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                       <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                          Click to enlarge
                       </div>
                    </div>
                    <button 
                      onClick={() => window.open(schedule.class_sched, '_blank')}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      title="Open in new tab"
                    />
                  </div>
                  <p className="mt-4 text-center text-sm text-gray-500 italic">
                    Click the image to view the full-size official document.
                  </p>
                </div>
              ) : (
                <div className="w-full rounded-lg border border-gray-200 py-12 text-center bg-gray-50">
                  <p className="text-gray-500 font-medium italic">Class schedule picture has not been uploaded</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
