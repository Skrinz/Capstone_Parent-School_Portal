import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { EditSchoolCalendarModal } from "@/components/admin/EditSchoolCalendarModal";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getAuthUser } from "@/lib/auth";
import { type SchoolCalendarItem } from "@/lib/schoolCalendarContent";
import { resolveMediaUrl } from "@/lib/api/base";
import { useAboutUsStore } from "@/lib/store/aboutUsStore";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";

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
      <div className="h-136 w-full animate-pulse rounded bg-gray-200" />
    </div>
    {showEdit && (
      <div className="fixed bottom-8 right-8 h-20 w-20 animate-pulse rounded-full bg-gray-200 shadow-lg" />
    )}
  </>
);

export const SchoolCalendar = () => {
  const user = getAuthUser();
  const isAdmin = user?.role === "admin";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const schoolCalendars = useAboutUsStore((state) => state.schoolCalendars);
  const isLoading = useAboutUsStore((state) => state.loading.schoolCalendars);
  const feedback = useAboutUsStore((state) => state.feedback);
  const fetchSchoolCalendars = useAboutUsStore((state) => state.fetchSchoolCalendars);
  const updateSchoolCalendar = useAboutUsStore((state) => state.updateSchoolCalendar);

  useEffect(() => {
    fetchSchoolCalendars().catch(() => undefined);
  }, [fetchSchoolCalendars]);

  const calendar = schoolCalendars[0];

  const handleSave = async (updatedCalendar: SchoolCalendarItem, file?: File) => {
    await updateSchoolCalendar(updatedCalendar, file);
    setIsModalOpen(false);
  };

  return (
    <div>
      <RoleAwareNavbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        {feedback?.section === "schoolCalendars" && (
          <StatusMessage
            type={feedback.type}
            message={feedback.message}
            className="mb-4"
          />
        )}
        {isLoading ? (
          <SchoolCalendarSkeleton showEdit={isAdmin} />
        ) : (
          <>
            <h1 className="mb-8 text-4xl font-bold">
              School Calendar
              {calendar?.year ? ` (${calendar.year})` : ""}
            </h1>

            {calendar ? (
              <div className="w-full rounded-sm bg-gray-300 p-8">
                <CalendarPreview imageUrl={calendar.imageUrl} />
              </div>
            ) : (
              <p>No school calendar data available.</p>
            )}

            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-(--button-green) text-white shadow-lg transition-transform hover:scale-105"
                aria-label={calendar ? "Edit School Calendar" : "Add School Calendar"}
              >
                {calendar ? (
                  <Pencil className="h-10 w-10" />
                ) : (
                  <Plus className="h-10 w-10" />
                )}
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
