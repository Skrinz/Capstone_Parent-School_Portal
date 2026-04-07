import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import EventCard from "@/components/general/EventCard";
import { usePartnershipEvents } from "@/hooks/usePartnershipEvents";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const EventListCardSkeleton = ({ showActions }: { showActions: boolean }) => (
  <div className="flex h-full flex-col gap-3">
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="h-48 w-full animate-pulse bg-gray-200" />
      <div className="flex min-h-56 flex-col bg-(--button-green) p-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-white/25" />
        <div className="mt-3 h-5 w-11/12 animate-pulse rounded bg-white/20" />
        <div className="mt-2 h-5 w-10/12 animate-pulse rounded bg-white/20" />
        <div className="mt-2 h-5 w-8/12 animate-pulse rounded bg-white/20" />
        <div className="mt-auto flex justify-end pt-4">
          <div className="h-8 w-28 animate-pulse rounded-full bg-white/20" />
        </div>
      </div>
    </div>
    {showActions && (
      <div className="flex items-center justify-end gap-3">
        <div className="h-9 w-20 animate-pulse rounded-md bg-gray-200" />
        <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200" />
      </div>
    )}
  </div>
);

const PartnershipEventsSkeleton = ({ showActions }: { showActions: boolean }) => (
  <>
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="h-10 w-72 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200 md:w-96" />
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
      <section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <EventListCardSkeleton key={index} showActions={showActions} />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-8 w-14 animate-pulse rounded-md bg-gray-200"
            />
          ))}
        </div>
      </section>

      <aside className="h-fit rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="mb-4 h-8 w-24 animate-pulse rounded bg-gray-200" />
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
          ))}
        </div>
      </aside>
    </div>
  </>
);

export const PartnershipAndEvents = () => {
  const { events: partnershipEvents, isLoading, deleteEvent } = usePartnershipEvents();
  const navigate = useNavigate();
  const userRole = useAuthStore((state) => state.user?.role);
  const isAdmin = userRole === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [eventToDeleteId, setEventToDeleteId] = useState<number | null>(null);
  const itemsPerPage = 6;

  const years = useMemo(
    () => Array.from(new Set(partnershipEvents.map((event) => event.year))).sort((a, b) => b - a),
    [partnershipEvents],
  );

  const filteredEvents = useMemo(() => {
    return partnershipEvents.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === "all" || event.year === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [partnershipEvents, searchQuery, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage]);

  const handleDeleteEvent = async () => {
    if (eventToDeleteId === null) {
      return;
    }

    await deleteEvent(eventToDeleteId);
    setEventToDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <RoleAwareNavbar />
      <main className="max-w-7xl mx-auto py-10 px-4">
        {isLoading ? (
          <PartnershipEventsSkeleton showActions={isAdmin} />
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Partnerships & Events
                </h1>
                <p className="text-gray-600 mt-2">
                  Explore school highlights, community programs, and partner activities.
                </p>
              </div>
              <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search event name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-(--button-green)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
          <section>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedEvents.map((event) => (
                <div key={event.id} className="flex h-full flex-col gap-3">
                  <Link
                    to={`/partnership&events/${event.slug}`}
                    className="group block h-full"
                  >
                    <EventCard
                      title={event.title}
                      description={event.description}
                      imageUrl={event.imageUrl}
                    />
                  </Link>
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        onClick={() => navigate(`/admin-edit-event/${event.id}`)}
                        className="bg-(--button-green) text-white hover:bg-(--button-green)"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setEventToDeleteId(event.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {paginatedEvents.length === 0 && (
              <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow-sm ring-1 ring-black/5">
                No events found.
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-md px-3 py-1.5 font-semibold text-white bg-(--button-green) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                const isActive = page === currentPage;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-md px-3 py-1.5 font-semibold ${
                      isActive
                        ? "bg-(--button-green) text-white"
                        : "bg-white text-gray-700 ring-1 ring-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md px-3 py-1.5 font-semibold text-white bg-(--button-green) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </section>

          <aside className="h-fit rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">By Year</h3>
            <div className="space-y-2 text-3xl leading-none">
              <button
                type="button"
                onClick={() => setSelectedYear("all")}
                className={`block w-full text-left rounded-md px-2 py-1 transition-colors ${
                  selectedYear === "all"
                    ? "bg-(--button-green) text-white font-bold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`block w-full text-left rounded-md px-2 py-1 transition-colors ${
                    selectedYear === year
                      ? "bg-(--button-green) text-white font-bold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </aside>
        </div>
          </>
        )}
      </main>

      {isAdmin && eventToDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-xl font-bold text-gray-900">Delete Event?</h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this partnership and event? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEventToDeleteId(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={() => void handleDeleteEvent()}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
