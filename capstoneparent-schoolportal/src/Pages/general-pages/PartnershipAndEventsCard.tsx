import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import {
	getPartnershipEventBySlug,
	partnershipEvents,
} from "@/lib/partnershipEvents";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";

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

export const PartnershipAndEventsCard = () => {
	const { eventSlug } = useParams<{ eventSlug: string }>();

	if (!eventSlug) {
		return <Navigate to="/partnership&events" replace />;
	}

	const event = getPartnershipEventBySlug(eventSlug);

	const relatedEvents = useMemo(() => {
		if (!event) {
			return [];
		}

		return partnershipEvents
			.filter((item) => item.id !== event.id)
			.slice(0, 5);
	}, [event]);

	const hashtagsText = event?.hashtags.join(" ") ?? "";

	if (!event) {
		return (
			<div className="min-h-screen bg-white">
				<RoleAwareNavbar />
				<main className="mx-auto max-w-3xl px-4 py-16">
					<section className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
						<h1 className="text-3xl font-bold text-gray-900">Event not found</h1>
						<p className="mt-3 text-gray-600">
							The event you are trying to view does not exist or may have been removed.
						</p>
						<Link
							to="/partnership&events"
							className="mt-6 inline-flex items-center gap-2 rounded-lg bg-(--button-green) px-4 py-2 font-semibold text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to all events
						</Link>
					</section>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<RoleAwareNavbar />

			<main className="mx-auto max-w-7xl px-4 py-10">
				<div className="mb-6">
					<Link
						to="/partnership&events"
						className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-gray-50"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Partnerships & Events
					</Link>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
					<article className="space-y-6">
						<header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
							<h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
								{event.title}
							</h1>
						</header>

						<DetailImage src={event.imageUrl} alt={event.title} />

						<section className="rounded-2xl bg-(--button-green) p-6 text-white shadow-sm ring-1 ring-black/5 md:p-8">
							<p className="text-3xl leading-snug md:text-4xl">{event.description}</p>
							<div className="mt-6 space-y-4 text-lg leading-relaxed text-white/95">
								{event.details.map((paragraph) => (
									<p key={paragraph}>{paragraph}</p>
								))}
								<p className="pt-2 text-base font-semibold text-(--tab-subtext)">{hashtagsText}</p>
							</div>
						</section>
					</article>

					<aside>
						<section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
							<h2 className="text-xl font-bold text-gray-900">Other Posts</h2>
							<div className="mt-4 space-y-3">
								{relatedEvents.map((item) => (
									<Link
										key={item.id}
										to={`/partnership&events/${item.slug}`}
										className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-(--button-green) hover:bg-emerald-50"
									>
										<p className="line-clamp-1 text-lg font-bold text-gray-800">{item.title}</p>
										<p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.description}</p>
									</Link>
								))}
							</div>
						</section>
					</aside>
				</div>
			</main>
		</div>
	);
};
