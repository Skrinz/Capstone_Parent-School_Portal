import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

interface EventCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  className?: string;
  ctaText?: string;
}

const EventCardImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
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

export default function EventCard({
  title,
  description,
  imageUrl,
  className,
  ctaText = "Read more",
}: EventCardProps) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md",
        className,
      )}
    >
      <EventCardImage src={imageUrl} alt={title} />
      <div className="flex min-h-56 flex-1 flex-col bg-(--button-green) p-4 text-white">
        <h2 className="text-2xl font-bold leading-tight line-clamp-2">{title}</h2>
        <p className="mt-2 text-lg leading-snug line-clamp-4">{description}</p>
        <div className="mt-auto flex items-end justify-end gap-3 pt-4">
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white transition-colors group-hover:bg-white/25">
            {ctaText}
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
