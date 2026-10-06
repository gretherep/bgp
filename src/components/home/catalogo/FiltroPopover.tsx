"use client";

import { useEffect, useRef, useState } from "react";

/** Chip desplegable de la barra de filtros (PC). Se cierra con clic fuera o Esc. */
export default function FiltroPopover({
  label,
  valor,
  activo,
  children,
  ancho = "w-64",
}: {
  label: string;
  valor?: string | null;
  activo: boolean;
  children: (cerrar: () => void) => React.ReactNode;
  ancho?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // id estable derivado de la etiqueta (useId difería entre servidor y cliente en esta página)
  const id = `filtro-${label.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, "-").toLowerCase()}`;

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold transition ${
          activo
            ? "border-primary/60 bg-primary/15 text-primary"
            : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/25 hover:text-white"
        }`}
      >
        {label}
        {valor && <span className="max-w-[9rem] truncate font-semibold text-white/90">: {valor}</span>}
        <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`} fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {abierto && (
        <div
          id={id}
          className={`absolute left-0 top-11 z-30 ${ancho} animate-fade-up rounded-2xl border border-white/10 bg-surface p-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)] [animation-duration:180ms]`}
        >
          {children(() => setAbierto(false))}
        </div>
      )}
    </div>
  );
}
