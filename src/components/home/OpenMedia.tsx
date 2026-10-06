"use client";

import { useMediaModal } from "@/app/context/MediaModalContext";
import type { HomeMedia } from "@/lib/catalog";
import { rutaTitulo } from "@/lib/format";

/**
 * Isla cliente mínima: los bloques se renderizan en servidor y solo este enlace necesita JS.
 * Es un <a> real a la ficha (/titulo/<slug>): un toque normal abre la ficha rápida (modal) sin
 * cambiar de página; Ctrl/⌘+clic, clic central o los buscadores van a la página completa.
 */
export default function OpenMedia({
  media,
  className,
  children,
  label,
}: {
  media: HomeMedia;
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  const { openModal } = useMediaModal();
  return (
    <a
      href={rutaTitulo(media)}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openModal(media);
      }}
      className={className}
      aria-label={label}
    >
      {children}
    </a>
  );
}
