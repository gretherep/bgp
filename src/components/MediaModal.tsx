"use client";

import { useMediaModal } from "@/app/context/MediaModalContext";
import { useHojaModal } from "@/hooks/useHojaModal";
import FichaTitulo from "@/components/ficha/FichaTitulo";

/**
 * Ficha rápida al tocar una tarjeta (sin cambiar de página). Hoja desde abajo en el móvil y
 * ventana centrada desde sm. Se monta solo mientras está abierta (MediaModalContext la carga bajo demanda).
 * "Atrás", Esc, la ✕ y el clic fuera cierran por el mismo camino, sin dejar entradas en el historial.
 */
export default function MediaModal() {
  const { selectedMedia, closeModal } = useMediaModal();
  const cerrar = useHojaModal(closeModal);
  if (!selectedMedia) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={selectedMedia.title.trim()}>
      <button type="button" aria-label="Cerrar ficha" onClick={cerrar} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative max-h-[92vh] w-full max-w-3xl animate-fade-up overflow-y-auto overscroll-contain rounded-t-3xl border border-b-0 border-white/10 bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl [animation-duration:220ms] sm:rounded-3xl sm:border-b sm:p-8">
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar ficha"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-white/10 active:scale-90"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <FichaTitulo media={selectedMedia} variante="modal" />
      </div>
    </div>
  );
}
