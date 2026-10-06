"use client";

import { useMediaModal } from "@/app/context/MediaModalContext";
import type { HomeMedia } from "@/lib/catalog";

// Isla cliente mínima: los bloques del Inicio se renderizan en servidor y solo
// este botón necesita JS para abrir el detalle.
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
    <button type="button" onClick={() => openModal(media)} className={className} aria-label={label}>
      {children}
    </button>
  );
}
