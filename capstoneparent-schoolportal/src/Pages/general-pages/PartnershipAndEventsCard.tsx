import { RoleAwareNavbar } from "@/components/general/RoleAwareNavbar";
import { usePartnershipEvents } from "@/hooks/usePartnershipEvents";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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
			className="aspect-[16/8.5] w-full rounded-2xl object-cover ring-1 ring-black/5"
		/>
	);
};

const EventDetailSkeleton = ({ showActions }: { showActions: boolean }) => (
	<div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
		<article className="space-y-6">
			<header className="relative bg-white">
				<div className="mb-4 h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
				{showActions && (
					<div className="absolute top-6 right-6 flex items-center gap-3">
						<div className="h-11 w-11 animate-pulse rounded-full bg-gray-200" />
						<div className="h-11 w-11 animate-pulse rounded-full bg-gray-200" />
					</div>
				)}
				<div className={`h-14 w-2/3 animate-pulse rounded bg-gray-200 ${showActions ? "pr-24" : ""}`} />
			</header>

			<div className="h-[28rem] w-full animate-pulse rounded-2xl bg-gray-200 ring-1 ring-black/5" />

			<section className="rounded-2xl bg-(--button-green) p-6 shadow-sm ring-1 ring-black/5 md:p-8">
				<div className="space-y-4">
					<div className="h-10 w-3/4 animate-pulse rounded bg-white/25" />
					<div className="h-5 w-full animate-pulse rounded bg-white/20" />
					<div className="h-5 w-[97%] animate-pulse rounded bg-white/20" />
					<div className="h-5 w-[94%] animate-pulse rounded bg-white/20" />
					<div className="h-5 w-[88%] animate-pulse rounded bg-white/20" />
				</div>
			</section>
		</article>

		<aside>
			<section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
				<div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
				<div className="mt-4 space-y-3">
					{Array.from({ length: 4 }, (_, index) => (
						<div key={index} className="rounded-lg border border-gray-200 p-3">
							<div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
							<div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200" />
							<div className="mt-1 h-4 w-5/6 animate-pulse rounded bg-gray-200" />
						</div>
					))}
				</div>
			</section>
		</aside>
	</div>
);

export const PartnershipAndEventsCard = () => {
	const { eventSlug } = useParams<{ eventSlug: string }>();
	const navigate = useNavigate();
	const { events: partnershipEvents, isLoading, deleteEvent } = usePartnershipEvents();
	const userRole = useAuthStore((state) => state.user?.role);
	const isAdmin = userRole === "admin";
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	if (!eventSlug) {
		return <Navigate to="/partnership&events" replace />;
	}

	const event = partnershipEvents.find((event) => event.slug === eventSlug);

	const relatedEvents = useMemo(() => {
		if (!event) {
			return [];
		}

		return partnershipEvents
			.filter((item) => item.id !== event.id)
			.slice(0, 5);
	}, [event, partnershipEvents]);

	const hashtagsText = event?.hashtags.join(" ") ?? "";

	if (isLoading) {
		return (
			<div className="min-h-screen bg-white">
				<RoleAwareNavbar />
				<main className="mx-auto max-w-7xl px-4 py-10">
					<EventDetailSkeleton showActions={isAdmin} />
				</main>
			</div>
		);
	}

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

	const handleDeleteEvent = async () => {
		await deleteEvent(event.id);
		navigate("/partnership&events");
	};

	return (
		<div className="min-h-screen bg-white">
			<RoleAwareNavbar />

			<main className="mx-auto max-w-7xl px-4 py-10">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
					<article className="space-y-6">
						<header className="relative bg-white">
							<Link
								to="/partnership&events"
								className="mb-4 inline-flex items-center gap-2 rounded-lg bg-(--button-green) px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--button-green)"
							>
								<ArrowLeft className="h-4 w-4" />
								Back
							</Link>
							{isAdmin && (
								<div className="absolute top-6 right-6 flex items-center gap-3">
									<button
										type="button"
										onClick={() => navigate(`/admin-edit-event/${event.id}`)}
										className="inline-flex items-center gap-2 rounded-full bg-(--button-green) p-3 text-white transition-shadow hover:shadow-lg"
										title="Edit event"
									>
										<Pencil className="h-5 w-5" />
									</button>
									<button
										type="button"
										onClick={() => setIsDeleteModalOpen(true)}
										className="inline-flex items-center gap-2 rounded-full bg-red-500 p-3 text-white transition-shadow hover:shadow-lg"
										title="Delete event"
									>
										<Trash2 className="h-5 w-5" />
									</button>
								</div>
							)}
							<h1
								className={`text-3xl font-bold leading-tight text-gray-900 md:text-5xl ${
									isAdmin ? "pr-24" : ""
								}`}
							>
								{event.title}
							</h1>
						</header>

						<DetailImage src={event.imageUrl} alt={event.title} />

						<section className="rounded-2xl bg-(--button-green) p-6 text-white shadow-sm ring-1 ring-black/5 md:p-8">
							<div className="space-y-4 text-lg leading-relaxed text-white/95">
								<p className="text-3xl leading-snug md:text-4xl">{event.description}</p>
								{event.details.map((paragraph) => (
									<p key={paragraph}>{paragraph}</p>
								))}
								{hashtagsText && (
									<p className="pt-2 text-base font-semibold text-(--tab-subtext)">
										{hashtagsText}
									</p>
								)}
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

			{isAdmin && isDeleteModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="max-w-sm rounded-lg bg-white p-6 shadow-lg">
						<h2 className="mb-2 text-xl font-bold text-gray-900">Delete Event?</h2>
						<p className="mb-6 text-gray-600">
							Are you sure you want to delete this partnership and event? This action cannot be
							undone.
						</p>
						<div className="flex justify-end gap-3">
							<Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
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
