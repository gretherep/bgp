"use client";

import { Media } from "@/app/models/media";
import { useMediaModal } from "@/app/context/MediaModalContext";
import { useMediaRating } from "@/hooks/useMediaRating";

interface MediaCardProps {
  media: Media;
}

export default function MediaCard({ media }: MediaCardProps) {
  const { openModal } = useMediaModal();
  const avgRating = useMediaRating(media.id);

  return (
    <div
      onClick={() => openModal(media)}
      className="group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
    >
      <div className="relative pb-[150%]">
        <img
          src={media.poster_url || "https://placehold.co/300x450?text=Sin+Poster"}
          alt={media.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2">
          {media.title}
        </h3>

        <div className="flex justify-between text-xs text-[var(--color-accent)] mt-1">
          <span>{media.year}</span>
          <span>{media.category}</span>
        </div>

        {/* ⭐ SOLO LECTURA */}
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${
                i + 1 <= Math.round(avgRating)
                  ? "text-yellow-400"
                  : "text-[var(--color-accent)]"
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967h4.178c.969 0 1.371 1.24.588 1.81l-3.382 2.455 1.286 3.966c.3.922-.755 1.688-1.538 1.118L10 13.348l-3.38 2.455c-.783.57-1.838-.196-1.538-1.118l1.286-3.966-3.382-2.455c-.783-.57-.38-1.81.588-1.81h4.178L9.05 2.927z" />
            </svg>
          ))}
          <span className="text-xs ml-1">
            {avgRating ? avgRating.toFixed(1) : "–"}
          </span>
        </div>
      </div>
    </div>
  );
}
