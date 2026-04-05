import { Link } from "react-router-dom";
import EventCard from "@/components/general/EventCard";
import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";

interface Event {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
}

const events: Event[] = [
  {
    id: 1,
    title: "United Nations Day",
    description:
      "On United Nations Day, we celebrated our global community and explored the world through books.",
  },
  {
    id: 2,
    title: "Reading Month Celebration",
    description:
      "Share a book, share a story, and share the joy of reading this month with every learner.",
  },
  {
    id: 3,
    title: "Science Magic PH",
    description:
      "A spectacular show brought science to life and inspired students through hands-on demonstrations.",
  },
  {
    id: 4,
    title: "Career Day",
    description:
      "Young learners explored their future dreams while discovering resources that support each path.",
  },
];

export const RoleDashboardView = () => {
  return (
    <div>
      <RoleAwareNavbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="mb-2 text-center text-[24px] font-bold">Welcome to</h1>
        <h1 className="mb-12 text-center text-4xl font-bold">
          Pagsabungan Elementary School
        </h1>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Partnerships and Events</h2>
            <Link
              to="/partnership&events"
              className="font-semibold text-blue-600 hover:underline"
            >
              View more...
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                description={event.description}
                imageUrl={event.imageUrl}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-11.5 w-full py-16">
        <div className="absolute inset-0 bg-black bg-cover bg-center opacity-50" />

        <div className="relative z-10 mx-auto max-w-2xl px-4">
          <div className="rounded-lg bg-(--navbar-bg) p-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black">Vision & Mission</h2>
            <p className="mb-6 font-medium text-black">
              Pagsabungan Elementary School nurtures academic excellence and develops knowledgeable,
              honest, and responsible pupils prepared with lifelong skills.
            </p>
            <Link
              to="/visionandmission"
              className="inline-block bg-black px-8 py-2 font-bold text-white hover:bg-gray-800"
            >
              ABOUT US
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
