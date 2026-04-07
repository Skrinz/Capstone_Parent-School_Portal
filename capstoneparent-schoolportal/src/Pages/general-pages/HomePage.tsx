import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import EventCard from "@/components/general/EventCard";
import { usePartnershipEvents } from "@/hooks/usePartnershipEvents";
import { useAuthStore } from "@/lib/store/authStore";
import { Link } from "react-router-dom";

const HomeEventCardSkeleton = () => (
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
);

export const HomePage = () => {
  const { events, isLoading } = usePartnershipEvents();
  const userRole = useAuthStore((state) => state.user?.role);
  const isAdmin = userRole === "admin";
  const featuredEvents = events.slice(0, 4);

  return (
    <div>
      <RoleAwareNavbar />
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-[24px] font-bold mb-2 text-center">Welcome to</h1>
        <h1 className="text-4xl font-bold mb-8 text-center">
          Pagsabungan Elementary School
        </h1>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Partnerships and Events</h2>
            <Link to="/partnership&events" className="text-blue-600 font-semibold hover:underline">
              View more...
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <HomeEventCardSkeleton key={index} />
              ))}
            </div>
          ) : featuredEvents.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow-sm ring-1 ring-black/5">
              Partnership and events does not have a posts.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEvents.map((event) => (
                <Link
                  key={event.id}
                  to={isAdmin ? `/admin-edit-event/${event.id}` : `/partnership&events/${event.slug}`}
                  className="block h-full"
                >
                  <EventCard
                    title={event.title}
                    description={event.description}
                    imageUrl={event.imageUrl}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vision & Mission Section */}
      <div className="relative w-full py-14 mt-6">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/History_Pic.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/50" />

        {/* Content Container */}
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <div className="p-8 rounded-lg text-center bg-(--navbar-bg)">
            <h2 className="text-3xl font-bold mb-4 text-black">
              Vision & Mission
            </h2>
            <p className="text-black font-medium mb-6">
              The Pagsabungan Elementary School is a public school that nurtures
              academic excellence, producing knowledgeable, honest, and
              responsible pupils who are ready for lifelong skills.
            </p>
            <Link
              to="/visionandmission"
              className="inline-block bg-black text-white px-8 py-2 font-bold hover:bg-gray-800"
            >
              ABOUT US
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
