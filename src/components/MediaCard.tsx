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

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => openModal(media)}
      className="group relative cursor-pointer bg-white/[0.03] rounded-2xl overflow-hidden border border-white/5 hover:border-[var(--color-primary)]/50 transition-all duration-300 shadow-lg flex flex-col h-full"
    >
      
      {/* --- CONTENEDOR DE IMAGEN --- */}
      <div className="relative aspect-[2/3] overflow-hidden">
        
        {/* 🎀 CINTA DE ESTRENO */}
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
        
        {/* Sombreado estratégico */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

        {/* 🏷️ CATEGORÍA (Arriba Izquierda - Más pequeña y minimalista) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-1.5 py-0.5 text-[7px] md:text-[8px] font-black uppercase bg-indigo-600/80 text-white rounded-md backdrop-blur-sm tracking-tighter border border-white/10">
            {media.category}
          </span>
        </div>

        {/* 🗓️ AÑO (Abajo Derecha - Color Ambar/Dorado suave) */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <span className="px-2 py-0.5 text-[9px] font-black text-amber-400 bg-black/60 backdrop-blur-md border border-amber-400/30 rounded-md shadow-lg">
            {media.year}
          </span>
        </div>
      </div>

      {/* --- INFO INFERIOR --- */}
      <div className="p-3 bg-[#0d0d0d] flex-grow flex flex-col justify-between">
        <h3 className="font-bold text-[13px] md:text-sm text-white/90 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors leading-tight">
          {media.title}
        </h3>

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-2.5 h-2.5 ${
                    i + 1 <= Math.round(avgRating)
                      ? "text-yellow-400"
                      : "text-white/5"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967h4.178c.969 0 1.371 1.24.588 1.81l-3.382 2.455 1.286 3.966c.3.922-.755 1.688-1.538 1.118L10 13.348l-3.38 2.455c-.783.57-1.838-.196-1.538-1.118l1.286-3.966-3.382-2.455c-.783-.57-.38-1.81.588-1.81h4.178L9.05 2.927z" />
                </svg>
              ))}
            </div>
            <span className="text-[9px] font-black text-[var(--color-accent)] ml-0.5">
              {avgRating ? avgRating.toFixed(1) : "N/A"}
            </span>
          </div>

          {/* <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest">
            {media.idioma || "LAT"}
          </span> */}
        </div>
      </div>
    </motion.div>
  );
}