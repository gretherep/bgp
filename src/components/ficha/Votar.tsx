"use client";

import { useState } from "react";
import { api } from "@/utils/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useUserMediaRating } from "@/hooks/useUserMediaRating";
import { useToast } from "@/app/context/ToastContext";
import { EVENTO_ABRIR_LOGIN } from "@/lib/eventos";

/**
 * Estrellas para votar. Se carga aparte (next/dynamic) porque arrastra Supabase:
 * la ficha se ve y se usa sin esperar a este bloque.
 */
export default function Votar({ mediaId, titulo }: { mediaId: string; titulo: string }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { userRating, setUserRating } = useUserMediaRating(mediaId, user?.id ?? null);
  const [hover, setHover] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const votar = async (valor: number) => {
    if (!user) {
      showToast("Inicia sesión para calificar", true);
      window.dispatchEvent(new Event(EVENTO_ABRIR_LOGIN));
      return;
    }
    setEnviando(true);
    try {
      await api.post("/api/ratings", { mediaId, rating: valor });
      setUserRating(valor);
      showToast("⭐ ¡Gracias por tu voto!", false);
    } catch {
      showToast("No se pudo guardar tu voto. Inténtalo de nuevo.", true);
    } finally {
      setEnviando(false);
    }
  };

  const marcadas = hover || userRating || 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div className="flex" role="radiogroup" aria-label={`Tu calificación de ${titulo}`} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={userRating === v}
            aria-label={`${v} ${v === 1 ? "estrella" : "estrellas"}`}
            disabled={enviando}
            onMouseEnter={() => setHover(v)}
            onClick={() => votar(v)}
            className="flex h-9 w-8 items-center justify-center transition-transform hover:scale-110 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className={`h-6 w-6 ${v <= marcadas ? "text-amber-400" : "text-white/20"}`} fill={v <= marcadas ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinejoin="round" d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
            </svg>
          </button>
        ))}
      </div>
      <span className="text-xs font-semibold text-accent">{userRating ? `Tu voto: ${userRating}/5` : "Toca para calificar"}</span>
    </div>
  );
}
