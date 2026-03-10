import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { partnershipEvents } from "@/lib/partnershipEvents";
import { ArrowUpRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

export const PartnershipAndEvents = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const years = useMemo(
    () => Array.from(new Set(partnershipEvents.map((event) => event.year))).sort((a, b) => b - a),
    [],
  );

  const filteredEvents = useMemo(() => {
    return partnershipEvents.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === "all" || event.year === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [searchQuery, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage]);

  return (
    <div className="min-h-screen bg-white">
      <RoleAwareNavbar />
      <main className="max-w-7xl mx-auto py-10 px-4">
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
                <Link
                  key={event.id}
                  to={`/partnership&events/${event.slug}`}
                  className="group block h-full"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <EventCardImage src={event.imageUrl} alt={event.title} />
                    <div className="flex min-h-56 flex-1 flex-col bg-(--button-green) p-4 text-white">
                      <h2 className="text-2xl font-bold leading-tight line-clamp-2">
                        {event.title}
                      </h2>
                      <p className="mt-2 text-lg leading-snug line-clamp-4">
                        {event.description}
                      </p>
                      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                        <p className="text-base font-semibold text-(--tab-subtext) line-clamp-2">
                          {event.subtitle}
                        </p>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white transition-colors group-hover:bg-white/25">
                          Read more
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
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
      </main>
    </div>
  );
};
