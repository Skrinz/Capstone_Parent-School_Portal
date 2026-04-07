import { Search, Plus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { NavbarAdmin } from "@/components/admin/NavbarAdmin";
import { Button } from "@/components/ui/button";
import type { PartnershipEventFormData } from "@/components/admin/EditPartnershipAndEventsModal";
import { EditPartnershipAndEventsModal } from "@/components/admin/EditPartnershipAndEventsModal";
import { usePartnershipEvents } from "@/hooks/usePartnershipEvents";
import { useNavigate } from "react-router-dom";

const EventCardImage = ({ src, alt }: { src: string; alt: string }) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div
        className="relative w-full overflow-hidden bg-linear-to-br from-emerald-200 via-emerald-100 to-yellow-100"
        style={{ aspectRatio: "16 / 10" }}
      >
        <div className="absolute inset-0 bg-black/5" />
        <p className="absolute bottom-3 left-3 rounded-md bg-white/75 px-2 py-1 text-xs font-semibold text-gray-700 backdrop-blur">
          Event image unavailable
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setImageFailed(true)}
      className="w-full object-cover"
      style={{ aspectRatio: "16 / 10" }}
      loading="lazy"
    />
  );
};

const ManageEventsCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
    <div className="h-48 w-full animate-pulse bg-gray-200" />
    <div className="flex min-h-56 flex-col bg-(--button-green) p-4">
      <div className="h-8 w-3/4 animate-pulse rounded bg-white/25" />
      <div className="mt-3 h-5 w-11/12 animate-pulse rounded bg-white/20" />
      <div className="mt-2 h-5 w-10/12 animate-pulse rounded bg-white/20" />
      <div className="mt-2 h-5 w-8/12 animate-pulse rounded bg-white/20" />
      <div className="mt-auto flex justify-end pt-4">
        <div className="h-8 w-24 animate-pulse rounded-full bg-white/20" />
      </div>
    </div>
  </div>
);

const ManageEventsSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
    <section>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <ManageEventsCardSkeleton key={index} />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-8 w-14 animate-pulse rounded-md bg-gray-200" />
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
);

export const ManagePartnershipAndEvents = () => {
  const { events, isLoading, addEvent } = usePartnershipEvents();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const years = useMemo(
    () =>
      Array.from(new Set(events.map((event) => event.year))).sort(
        (a, b) => b - a,
      ),
    [events],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === "all" || event.year === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [searchQuery, selectedYear, events]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / itemsPerPage),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage]);

  const handleAddEvent = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveEvent = async (data: PartnershipEventFormData) => {
    if (!data.id) {
      const { id, ...eventData } = data;
      await addEvent(eventData);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <NavbarAdmin />
      <main className="max-w-7xl mx-auto py-10 px-4">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Manage Partnerships & Events
            </h1>
            <p className="text-gray-600 mt-2">
              View and manage all partnership and event posts.
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

        {isLoading ? (
          <ManageEventsSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
            <section>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => navigate(`/admin-edit-event/${event.id}`)}
                    className="group block h-full text-left"
                  >
                    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md relative">
                      <EventCardImage src={event.imageUrl} alt={event.title} />
                      <div className="flex min-h-56 flex-1 flex-col bg-(--button-green) p-4 text-white">
                        <h2 className="text-2xl font-bold leading-tight line-clamp-2">
                          {event.title}
                        </h2>
                        <p className="mt-2 text-lg leading-snug line-clamp-4">
                          {event.description}
                        </p>
                        <div className="mt-auto flex items-end justify-end gap-3 pt-4">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white transition-colors group-hover:bg-white/25">
                            View post
                          </span>
                        </div>
                      </div>
                    </article>
                  </button>
                ))}
              </div>

              {paginatedEvents.length === 0 && (
                <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow-sm ring-1 ring-black/5">
                  <p>No partnership and event posts yet.</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-md px-3 py-1.5 font-semibold text-white bg-(--button-green) disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </section>

            <aside className="h-fit rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900">By Year</h3>
              </div>
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
        )}
      </main>

      <Button
        onClick={handleAddEvent}
        className="fixed bottom-10 right-28 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-(--button-green) p-0 text-white shadow-lg transition-colors hover:bg-(--button-green)"
        title="Add Event"
      >
        <Plus className="h-14 w-14" strokeWidth={4.5} />
      </Button>

      {/* Add Modal */}
      <EditPartnershipAndEventsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
};
