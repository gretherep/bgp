"use client";

import { Media } from "@/app/models/media";
import { useMediaModal } from "@/app/context/MediaModalContext";
import { useMediaRating } from "@/hooks/useMediaRating";
import { motion } from "framer-motion";
import Image from "next/image";

interface MediaCardProps {
  media: Media;
  index?: number;
}

export default function MediaCard({ media, index = 0 }: MediaCardProps) {
  const { openModal } = useMediaModal();
  const avgRating = useMediaRating(media.id);

  // Debug para verificar que llega el dato:
  // console.log("Media item:", media.title, "Estreno:", media.estreno);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => openModal(media)}
      className="group relative cursor-pointer bg-white/[0.03] rounded-2xl overflow-hidden border border-white/5 hover:border-[var(--color-primary)]/50 transition-all duration-300 shadow-lg"
    >
      
      {/* --- CONTENEDOR DE IMAGEN --- */}
      <div className="relative aspect-[2/3] overflow-hidden">
        
        {/* 🎀 CINTA DE ESTRENO (Movida aquí adentro para mejor control) */}
        {!!media.estreno && (
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
            <div className="absolute top-4 -right-7 w-[120px] py-1 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black uppercase tracking-widest text-center rotate-45 shadow-md border-y border-white/20">
              Estreno
            </div>
          </div>
        )}

        <Image
          src={media.poster_url || "https://placehold.co/300x450/161616/DCDAD9?text=Sin+Poster"}
          alt={media.title}
          fill
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 300px"
          priority={index < 5}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-black/20" />

        {/* 🏷️ TABS FLOTANTES */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
          <span className="px-2 py-1 text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 border-2 border-orange-500/50 rounded-lg backdrop-blur-md">
            {media.year}
          </span>
          <span className="px-2 py-1 text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border-2 border-blue-500/50 rounded-lg backdrop-blur-md">
            {media.category}
          </span>
        </div>
      </div>

      {/* --- INFO --- */}
      <div className="p-4">
        <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
          {media.title}
        </h3>

        <div className="flex items-center gap-1 mt-3">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-3 h-3 ${
                  i + 1 <= Math.round(avgRating)
                    ? "text-yellow-400"
                    : "text-white/10"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967h4.178c.969 0 1.371 1.24.588 1.81l-3.382 2.455 1.286 3.966c.3.922-.755 1.688-1.538 1.118L10 13.348l-3.38 2.455c-.783.57-1.838-.196-1.538-1.118l1.286-3.966-3.382-2.455c-.783-.57-.38-1.81.588-1.81h4.178L9.05 2.927z" />
              </svg>
            ))}
          </div>
          <span className="text-[10px] font-bold text-[var(--color-accent)] ml-1">
            {avgRating ? avgRating.toFixed(1) : "N/A"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}