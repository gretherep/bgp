"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/apiClient";
import { useMediaModal } from "@/app/context/MediaModalContext";
import { useMediaRating } from "@/hooks/useMediaRating";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/app/context/ToastContext";
import { useUserMediaRating } from "@/hooks/useUserMediaRating";
import { Languages, X, Layers } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function MediaModal() {
  const { selectedMedia, closeModal } = useMediaModal();
  const { user } = useAuth();
  const { showToast } = useToast();

  const avgRating = useMediaRating(selectedMedia?.id ?? null);
  const { userRating, setUserRating } = useUserMediaRating(
    selectedMedia?.id ?? null,
    user?.id ?? null
  );

  const [hoverRating, setHoverRating] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (selectedMedia) {
      window.history.pushState({ modalOpen: true }, "");
      const handlePopState = () => closeModal();
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [selectedMedia, closeModal]);

  if (!selectedMedia) return null;

  const handleVote = async (value: number) => {
    if (!user) { showToast("Debes iniciar sesión para calificar", true); return; }
    try {
      await api.post("/api/ratings", { mediaId: selectedMedia.id, rating: value });
      setUserRating(value);
      showToast("⭐ ¡Gracias por tu voto!", false);
    } catch (err: any) {
      console.error(err);
      showToast("❌ Error al votar", true);
    }
  };

  const vividColors = [
    { bg: "rgba(59, 130, 246, 0.25)", border: "rgba(59, 130, 246, 0.9)" },
    { bg: "rgba(16, 185, 129, 0.25)", border: "rgba(16, 185, 129, 0.9)" },
    { bg: "rgba(239, 68, 68, 0.25)", border: "rgba(239, 68, 68, 0.9)" },
    { bg: "rgba(168, 85, 247, 0.25)", border: "rgba(168, 85, 247, 0.9)" },
  ];

  const categoryStyle = { bg: "rgba(14, 165, 233, 0.25)", border: "rgba(14, 165, 233, 0.9)" };
  const yearStyle = { bg: "rgba(34, 197, 94, 0.25)", border: "rgba(34, 197, 94, 0.9)" };
  const languageStyle = { bg: "rgba(245, 158, 11, 0.25)", border: "rgba(245, 158, 11, 0.9)" };

  const genres = selectedMedia.genre ? selectedMedia.genre.split(",").map(g => g.trim()) : [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={closeModal}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl text-gray-300"
        style={{
          backgroundColor: "rgba(15, 15, 15, 0.98)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          maxHeight: '90vh',
        }}
      >
        <button onClick={closeModal} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center z-10 text-white transition-all active:scale-90">
          <X size={20} />
        </button>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 overflow-y-auto max-h-[90vh] no-scrollbar">
          <div className="md:w-1/3 flex-shrink-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-[#0e0e0e] border border-white/10 shadow-2xl shadow-black relative">
              {imageError || !selectedMedia.poster_url ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-2">
                  <div className="text-4xl mb-2">🎬</div>
                  <span className="text-indigo-400 text-xs font-bold">Sin póster</span>
                </div>
              ) : (
                <Image
                  src={selectedMedia.poster_url}
                  alt={selectedMedia.title}
                  fill
                  unoptimized={true} // <--- CLAVE: No gasta transformaciones
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-5 min-w-0">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight italic uppercase tracking-tighter mb-1">
                {selectedMedia.title}
              </h2>

              {/* BLOQUE DE TEMPORADAS MEJORADO */}
              {selectedMedia.seasons && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Layers size={14} className="text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                    {selectedMedia.seasons} {Number(selectedMedia.seasons) === 1 ? 'Temporada' : 'Temporadas'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: categoryStyle.bg, border: `1px solid ${categoryStyle.border}`, color: "#fff" }}>
                {selectedMedia.category}
              </span>

              {selectedMedia.idioma && (
                <span className="px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 uppercase" style={{ backgroundColor: languageStyle.bg, border: `1px solid ${languageStyle.border}`, color: "#fff" }}>
                  <Languages size={12} className="text-amber-400" />
                  {selectedMedia.idioma}
                </span>
              )}

              {genres.map((genre, index) => (
                <span key={index} className="px-3 py-1 rounded-lg text-[10px] font-black uppercase" style={{ backgroundColor: vividColors[index % vividColors.length].bg, border: `1px solid ${vividColors[index % vividColors.length].border}`, color: "#fff" }}>
                  {genre}
                </span>
              ))}

              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase" style={{ backgroundColor: yearStyle.bg, border: `1px solid ${yearStyle.border}`, color: "#fff" }}>
                {selectedMedia.year}
              </span>
            </div>

            <div className="flex items-center bg-white/5 self-start px-4 py-2 rounded-2xl border border-white/5">
              <div className="flex space-x-1 mr-4">
                {Array.from({ length: 5 }, (_, i) => {
                  const ratingValue = i + 1;
                  const effectiveRating = hoverRating > 0 ? hoverRating : userRating ?? Math.round(avgRating || 0);
                  const showFilled = ratingValue <= effectiveRating;
                  return (
                    <button key={i} onMouseEnter={() => setHoverRating(ratingValue)} onMouseLeave={() => setHoverRating(0)} onClick={() => handleVote(ratingValue)} className="transition-transform hover:scale-125">
                      <svg className={`w-5 h-5 ${showFilled ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" : "text-white/10"}`} fill={showFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
              <span className="text-sm font-black text-indigo-400 tracking-tighter italic">{avgRating ? avgRating.toFixed(1) : "0.0"}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest italic opacity-80">Sinopsis</h3>
              <p className="text-sm leading-relaxed text-white/80 font-medium max-h-40 overflow-y-auto no-scrollbar">{selectedMedia.synopsis || "Sinopsis no disponible."}</p>
            </div>

            <div className="mt-auto pt-6 border-t border-white/5 flex justify-end items-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Lanzamiento oficial {selectedMedia.year}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}