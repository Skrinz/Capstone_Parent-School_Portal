import { NavbarAdmin } from "@/components/admin/NavbarAdmin";
import { EditPartnershipAndEventsDetailsModal } from "@/components/admin/EditPartnershipAndEventsDetailsModal";
import { usePartnershipEvents } from "@/hooks/usePartnershipEvents";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import type { PartnershipEventItem } from "@/lib/partnershipEvents";

const DetailImage = ({ src, alt }: { src: string; alt: string }) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-linear-to-br from-emerald-200 via-emerald-100 to-yellow-100 ring-1 ring-black/5">
        <div className="absolute inset-0 bg-black/5" />
        <p className="absolute bottom-3 left-3 rounded-md bg-white/80 px-3 py-1 text-sm font-semibold text-gray-700 backdrop-blur">
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
      className="aspect-video w-full rounded-2xl object-cover ring-1 ring-black/5"
    />
  );
};

export const EditPartnershipAndEventsDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, updateEvent } = usePartnershipEvents();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!eventId) {
    return <Navigate to="/managepartnershipandevents" replace />;
  }

  const event = events.find((e) => e.id === parseInt(eventId));

  if (!event) {
    return (
      <div className="min-h-screen bg-white">
        <NavbarAdmin />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <h1 className="text-3xl font-bold text-gray-900">Event not found</h1>
            <p className="mt-3 text-gray-600">
              The event you are trying to view does not exist or may have been removed.
            </p>
            <button
              onClick={() => navigate("/managepartnershipandevents")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-(--button-green) px-4 py-2 font-semibold text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to events
            </button>
          </section>
        </main>
      </div>
    );
  }

  const hashtagsText = event.hashtags.join(" ");

  const handleSaveEvent = async (updatedEvent: PartnershipEventItem) => {
    updateEvent(event.id, updatedEvent);
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <NavbarAdmin />

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6">
          <button
            onClick={() => navigate("/managepartnershipandevents")}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Partnerships & Events
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="space-y-6">
            <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8 relative">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute top-6 right-6 inline-flex items-center gap-2 rounded-full bg-(--button-green) p-3 text-white hover:shadow-lg transition-shadow"
                title="Edit event"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl pr-14">
                {event.title}
              </h1>
            </header>

            <DetailImage src={event.imageUrl} alt={event.title} />

            <section className="rounded-2xl bg-(--button-green) p-6 text-white shadow-sm ring-1 ring-black/5 md:p-8">
              <p className="text-3xl leading-snug md:text-4xl">{event.description}</p>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-white/95">
                {event.details.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
                <p className="pt-2 text-base font-semibold text-(--tab-subtext)">{hashtagsText}</p>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Date</h3>
                <p className="mt-1 text-gray-700">{event.dateLabel}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Location</h3>
                <p className="mt-1 text-gray-700">{event.location}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Organizer</h3>
                <p className="mt-1 text-gray-700">{event.organizer}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Audience</h3>
                <p className="mt-1 text-gray-700">{event.audience}</p>
              </div>
              {event.highlights.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Highlights</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {event.highlights.map((highlight, idx) => (
                      <li key={idx} className="text-gray-700">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </article>

          <aside>
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-xl font-bold text-gray-900">Event Info</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-600">Year</p>
                  <p className="text-gray-900">{event.year}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* Edit Modal */}
      <EditPartnershipAndEventsDetailsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        event={event}
        onSave={handleSaveEvent}
      />
    </div>
  );
};
