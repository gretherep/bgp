"use client";

import { useEffect, useState } from "react";
import { Media } from "@/app/models/media";
import { useAuth } from "@/hooks/useAuth";
import { useMediaModal } from "@/app/context/MediaModalContext";
import { supabase } from "@/utils/supabaseClient";
import { useToast } from "@/app/context/ToastContext";



interface MediaCardProps {
  media: Media;
}

const MediaCard: React.FC<MediaCardProps> = ({ media }) => {
  const { user } = useAuth();
  const { openModal } = useMediaModal();
  const { showToast } = useToast();
  const [currentRating, setCurrentRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isOpening, setIsOpening] = useState(false);

  // ✅ 1️⃣ Cargar promedio inicial desde BD
  useEffect(() => {
    const loadAvg = async () => {
      const res = await fetch(`/api/ratings/avg?mediaId=${media.id}`);
      const data = await res.json();
      setCurrentRating(data.avg);
    };

    loadAvg();
  }, [media.id]);

  // ✅ 2️⃣ Realtime: escuchar cambios en ratings
  useEffect(() => {
    const channel = supabase
      .channel(`ratings-media-${media.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ratings",
          filter: `media_id=eq.${media.id}`,
        },
        async () => {
          const res = await fetch(`/api/ratings/avg?mediaId=${media.id}`);
          const data = await res.json();
          setCurrentRating(data.avg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [media.id]);

const handleRating = async (value: number) => {
  if (!user) {
    showToast("Debes iniciar sesión para calificar", true);
    return;
  }

  try {
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaId: media.id,
        rating: value,
        userId: user.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Error al registrar el voto", true);
      return;
    }

    // ✅ TOAST DE ÉXITO
    showToast("✅ ¡Gracias por tu voto!", false);

  } catch (error) {
    console.error(error);
    showToast("❌ Error de conexión", true);
  }
};

  const handleCardClick = () => {
    if (isOpening) return;
    setIsOpening(true);
    openModal(media);
    setTimeout(() => setIsOpening(false), 300);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5"
    >
      {/* Poster */}
      <div className="relative pb-[150%] sm:pb-[140%] bg-gray-800">
        <img
          src={media.poster_url || "https://placehold.co/150x230/1f2937/FFF?text=No+Poster"}
          alt={media.title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/150x230/1f2937/FFF?text=No+Poster";
          }}
        />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-2 leading-tight mb-1">
          {media.title}
        </h3>

        <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
          <span>{media.year}</span>
          <span className="bg-gray-800 px-1.5 py-0.5 rounded">
            {media.category}
          </span>
        </div>

        {/* ⭐ RATING */}
        <div className="flex items-center space-x-0.5">
          {Array.from({ length: 5 }, (_, i) => {
            const ratingValue = i + 1;
            const showFilled = hoverRating
              ? ratingValue <= hoverRating
              : ratingValue <= currentRating;

            return (
              <button
                key={i}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setHoverRating(ratingValue);
                }}
                onMouseLeave={() => setHoverRating(0)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRating(ratingValue);
                }}
              >
                <svg
                  className={`w-4 h-4 ${
                    showFilled ? "text-amber-400" : "text-gray-600"
                  }`}
                  fill={showFilled ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            );
          })}

          <span className="text-gray-500 text-xs ml-1">
            {currentRating ? currentRating.toFixed(1) : "–"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
