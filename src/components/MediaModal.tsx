"use client";

import { useState, useEffect } from "react";
import { useMediaModal } from "@/app/context/MediaModalContext";
import { useMediaRating } from "@/hooks/useMediaRating";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/app/context/ToastContext";
import { useUserMediaRating } from "@/hooks/useUserMediaRating";
import { Languages, X } from "lucide-react";
import { Media } from "@/types/global";

export default function MediaModal() {
  const { selectedMedia, closeModal } = useMediaModal();
  const { user } = useAuth();
  const { showToast } = useToast();

  interface MediaModalProps {
  media: Media; // O MediaItem si extendiste el tipo
  onClose: () => void;
}
  const avgRating = useMediaRating(selectedMedia?.id ?? null);
  const { userRating, setUserRating } = useUserMediaRating(
    selectedMedia?.id ?? null,
    user?.id ?? null
  );

  const [hoverRating, setHoverRating] = useState(0);
  const [imageError, setImageError] = useState(false);

  // ==========================================
  // LÓGICA PARA BOTÓN ATRÁS (MÓVIL)
  // ==========================================
  useEffect(() => {
    if (selectedMedia) {
      // 1. Añadimos un estado falso al historial cuando el modal se abre
      window.history.pushState({ modalOpen: true }, "");

      // 2. Escuchamos cuando el usuario pulsa "Atrás"
      const handlePopState = (e: PopStateEvent) => {
        // Al detectar el retroceso, cerramos el modal manualmente
        closeModal();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        // Si el modal se cierra por clic en la X o fuera, 
        // limpiamos el historial si aún queda nuestro estado falso
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      };
    }
  }, [selectedMedia, closeModal]);
  // ==========================================

  if (!selectedMedia) return null;

  const handleVote = async (value: number) => {
    if (!user) {
      showToast("Debes iniciar sesión para calificar", true);
      return;
    }

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: selectedMedia.id,
          rating: value,
          userId: user.id,
        }),
      });
      setUserRating(value);
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Error al votar", true);
        return;
      }
      showToast("⭐ ¡Gracias por tu voto!", false);
    } catch {
      showToast("❌ Error de conexión", true);
    }
  };

  const vividColors = [
    { bg: "rgba(59, 130, 246, 0.25)", border: "rgba(59, 130, 246, 0.9)" },
    { bg: "rgba(16, 185, 129, 0.25)", border: "rgba(16, 185, 129, 0.9)" },
    { bg: "rgba(239, 68, 68, 0.25)", border: "rgba(239, 68, 68, 0.9)" },
    { bg: "rgba(234, 179, 8, 0.25)", border: "rgba(234, 179, 8, 0.9)" },
    { bg: "rgba(168, 85, 247, 0.25)", border: "rgba(168, 85, 247, 0.9)" },
    { bg: "rgba(236, 72, 153, 0.25)", border: "rgba(236, 72, 153, 0.9)" },
  ];

  const categoryStyle = { bg: "rgba(14, 165, 233, 0.25)", border: "rgba(14, 165, 233, 0.9)" };
  const yearStyle = { bg: "rgba(34, 197, 94, 0.25)", border: "rgba(34, 197, 94, 0.9)" };
  const languageStyle = { bg: "rgba(245, 158, 11, 0.25)", border: "rgba(245, 158, 11, 0.9)" };

  const genres = selectedMedia.genre ? selectedMedia.genre.split(",").map(g => g.trim()) : [];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl text-[var(--color-secondary)]"
        style={{
          backgroundColor: "rgba(22, 18, 20, 0.95)",
          border: "1px solid rgba(149, 153, 158, 0.3)",
          backdropFilter: "blur(12px)",
          maxHeight: '90vh',
        }}
      >
        <button onClick={closeModal} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center z-10 text-white transition-colors">
          <X size={20} />
        </button>

        <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto max-h-[85vh] no-scrollbar">
          {/* Poster */}
          <div className="md:w-1/3 flex-shrink-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#0e0e0e] flex items-center justify-center border border-white/5">
              {imageError || !selectedMedia.poster_url ? (
                <div className="text-center p-2"><div className="text-4xl mb-2">🎬</div><span className="text-[var(--color-accent)] text-xs">Sin póster</span></div>
              ) : (
                <img src={selectedMedia.poster_url} alt={selectedMedia.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight italic uppercase tracking-tighter">
              {selectedMedia.title}
            </h2>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: categoryStyle.bg, border: `1px solid ${categoryStyle.border}`, color: "#fff" }}>
                {selectedMedia.category}
              </span>

              {selectedMedia.idioma && selectedMedia.idioma.trim() !== "" && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 uppercase" style={{ backgroundColor: languageStyle.bg, border: `1px solid ${languageStyle.border}`, color: "#fff" }}>
                  <Languages className="w-3 h-3 text-amber-400" />
                  {selectedMedia.idioma}
                </span>
              )}

              {genres.map((genre, index) => {
                const color = vividColors[index % vividColors.length];
                return (
                  <span key={genre} className="px-3 py-1 rounded-full text-[10px] font-black uppercase transition-transform hover:scale-105" style={{ backgroundColor: color.bg, border: `1px solid ${color.border}`, color: "#fff" }}>
                    {genre}
                  </span>
                );
              })}

              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase" style={{ backgroundColor: yearStyle.bg, border: `1px solid ${yearStyle.border}`, color: "#fff" }}>
                {selectedMedia.year}
              </span>
            </div>

            {/* Votación */}
            <div className="flex items-center space-x-1 py-2">
               {Array.from({ length: 5 }, (_, i) => {
                const ratingValue = i + 1;
                const effectiveRating = hoverRating > 0 ? hoverRating : userRating ?? Math.round(avgRating);
                const showFilled = ratingValue <= effectiveRating;
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setHoverRating(ratingValue)} 
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleVote(ratingValue)}
                    className="focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  >
                    <svg className={`w-6 h-6 ${showFilled ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-white/10"}`} fill={showFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                );
              })}
              <div className="ml-3 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-black text-[var(--color-primary)]">
                {avgRating ? avgRating.toFixed(1) : "N/A"}
              </div>
            </div>

            {/* Sinopsis */}
            <div className="flex-1">
              <h3 className="text-[10px] font-black uppercase text-[var(--color-accent)] tracking-widest mb-2 italic">Sinopsis</h3>
              <p className="text-sm leading-relaxed text-white/70">
                {selectedMedia.synopsis || "Sinopsis no disponible."}
              </p>
            </div>

            {/* Fecha */}
            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                Agregado el {selectedMedia.created_at ? formatDate(selectedMedia.created_at) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}