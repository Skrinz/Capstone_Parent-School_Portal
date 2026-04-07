import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { EditSchoolCalendarModal } from "@/components/admin/EditSchoolCalendarModal";
import { getAuthUser } from "@/lib/auth";
import { type SchoolCalendarItem } from "@/lib/schoolCalendarContent";
import { pagesApi } from "@/lib/api/pagesApi";
import { resolveMediaUrl } from "@/lib/api/base";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";

const CalendarPreview = ({ imageUrl }: { imageUrl: string }) => {
  const [hasImageError, setHasImageError] = useState(false);

  if (hasImageError || !imageUrl) {
    return (
      <div className="flex min-h-130 w-full items-center justify-center rounded-sm bg-white p-8 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-700">Calendar file not found</p>
          <p className="mt-2 text-lg text-gray-600">No calendar image has been uploaded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolveMediaUrl(imageUrl)}
      alt="School calendar"
      onError={() => setHasImageError(true)}
      className="h-auto w-full rounded-sm bg-white object-contain"
    />
  );
};

const SchoolCalendarSkeleton = ({ showEdit }: { showEdit: boolean }) => (
  <>
    <div className="mb-8 h-10 w-60 animate-pulse rounded bg-gray-200" />
    <div className="w-full rounded-sm bg-gray-300 p-8">
      <div className="h-[34rem] w-full animate-pulse rounded bg-gray-200" />
    </div>
    {showEdit && (
      <div className="fixed bottom-8 right-8 h-20 w-20 animate-pulse rounded-full bg-gray-200 shadow-lg" />
    )}
  </>
);

export const SchoolCalendar = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === "admin" || user?.role === "principal";

  const [schoolCalendars, setSchoolCalendars] = useState<SchoolCalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    pagesApi
      .getSchoolCalendars()
      .then((data) => setSchoolCalendars(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const calendar = schoolCalendars[0];

  const handleSave = async (updatedCalendar: SchoolCalendarItem, file?: File) => {
    try {
      await pagesApi.updateSchoolCalendar(updatedCalendar, file);
      const data = await pagesApi.getSchoolCalendars();
      setSchoolCalendars(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save calendar", error);
    }
  };

  return (
    <div>
      <RoleAwareNavbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        {isLoading ? (
          <SchoolCalendarSkeleton showEdit={isAdmin} />
        ) : !calendar ? (
          <>
            <h1 className="mb-8 text-4xl font-bold">School Calendar</h1>
            <p>No school calendar data available.</p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center justify-center rounded-md bg-(--button-green) px-4 py-2 text-white"
              >
                Add Calendar
              </button>
            )}
          </>
        ) : (
          <>
            <h1 className="mb-8 text-4xl font-bold">School Calendar</h1>
            <div className="w-full rounded-sm bg-gray-300 p-8">
              <CalendarPreview imageUrl={calendar.imageUrl} />
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-(--button-green) text-white shadow-lg transition-transform hover:scale-105"
                aria-label="Edit School Calendar"
              >
                <Pencil className="h-10 w-10" />
              </button>
            )}
          </>
        )}
      </div>

      {isAdmin && (
        <EditSchoolCalendarModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={calendar ? "edit" : "add"}
          calendars={schoolCalendars}
          editYear={calendar?.year}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
