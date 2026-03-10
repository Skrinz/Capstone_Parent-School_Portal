import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { useState } from "react";

type CalendarItem = {
  year: string;
  label: string;
  imageUrl: string;
  note: string;
};

const schoolCalendars: CalendarItem[] = [
  {
    year: "2025",
    label: "2025 - 2026",
    imageUrl: "/school-calendar-2025-2026.png",
    note: "Latest monthly school activities and key academic dates.",
  },
  {
    year: "2024",
    label: "2024 - 2025",
    imageUrl: "/school-calendar-2024-2025.png",
    note: "Official school calendar for enrollment, class days, and school events.",
  },
  {
    year: "2023",
    label: "2023 - 2024",
    imageUrl: "/school-calendar-2023-2024.png",
    note: "Archived school-year calendar reference.",
  },
  {
    year: "2022",
    label: "2022 - 2023",
    imageUrl: "/school-calendar-2022-2023.png",
    note: "Archived school-year calendar reference.",
  },
  {
    year: "2021",
    label: "2021 - 2022",
    imageUrl: "/school-calendar-2021-2022.png",
    note: "Archived school-year calendar reference.",
  },
];

const CalendarPreview = ({ imageUrl, label }: { imageUrl: string; label: string }) => {
  const [hasImageError, setHasImageError] = useState(false);

  if (hasImageError) {
    return (
      <div className="flex min-h-130 w-full items-center justify-center rounded-sm bg-white p-8 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-700">Calendar file not found</p>
          <p className="mt-2 text-lg text-gray-600">
            Add the file for School Year {label} in `public/` to display it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`School Calendar ${label}`}
      onError={() => setHasImageError(true)}
      className="h-auto w-full rounded-sm bg-white object-contain"
    />
  );
};

export const SchoolCalendar = () => {
  const [selectedYear, setSelectedYear] = useState("2025");
  const selectedCalendar =
    schoolCalendars.find((calendar) => calendar.year === selectedYear) ?? schoolCalendars[0];

  return (
    <div>
      <RoleAwareNavbar />
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8">School Calendar ({selectedCalendar.label})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="w-full rounded-sm bg-gray-300 p-8">
              <CalendarPreview
                imageUrl={selectedCalendar.imageUrl}
                label={selectedCalendar.label}
              />
            </div>
            <p className="text-center font-bold mt-4">School Year {selectedCalendar.label}</p>
            <p className="text-center text-gray-600 mt-2">{selectedCalendar.note}</p>
          </div>

          <div className="lg:col-span-1 flex lg:block lg:w-full w-fit mx-auto">
            <div>
              <h3 className="font-bold text-lg mb-4">Year</h3>
              <div className="space-y-2">
                {schoolCalendars.map((calendar) => (
                  <button
                    key={calendar.year}
                    onClick={() => setSelectedYear(calendar.year)}
                    className={`block w-full text-left py-2 px-3 rounded transition ${
                      selectedYear === calendar.year
                        ? "bg-blue-500 text-white font-semibold"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {calendar.year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};