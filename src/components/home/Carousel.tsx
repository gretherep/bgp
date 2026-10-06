"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fila horizontal con scroll-snap. Las flechas (Anterior/Siguiente) van en la cabecera, junto
 * al título, para no tapar pósters ni cambiar el alto de la fila. Solo se muestran en
 * dispositivos con puntero; en táctil se desliza con el dedo.
 */
export default function Carousel({
  titulo,
  accion,
  children,
  className = "",
}: {
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [puedeAtras, setPuedeAtras] = useState(false);
  const [puedeAdelante, setPuedeAdelante] = useState(false);

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setPuedeAtras(el.scrollLeft > 4);
    setPuedeAdelante(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    el.addEventListener("scroll", medir, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, [medir]);

  // Apunta a un elemento concreto (un punto de snap) en vez de usar scrollBy: con
  // snap-mandatory, Chrome devuelve el scroll al punto anterior si el destino cae entre dos ítems.
  const mover = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const base = el.getBoundingClientRect().left - el.scrollLeft;
    const posiciones = [...el.querySelectorAll("li")].map((li) => li.getBoundingClientRect().left - base - pad);
    const objetivo = el.scrollLeft + dir * el.clientWidth * 0.8;
    const max = el.scrollWidth - el.clientWidth;
    let destino: number;
    if (dir > 0) {
      const siguientes = posiciones.filter((p) => p > el.scrollLeft + 1);
      destino = siguientes.filter((p) => p <= objetivo + 1).pop() ?? siguientes[0] ?? max;
    } else {
      const anteriores = posiciones.filter((p) => p < el.scrollLeft - 1);
      destino = anteriores.find((p) => p >= objetivo - 1) ?? anteriores[anteriores.length - 1] ?? 0;
    }
    el.scrollTo({ left: Math.min(Math.max(destino, 0), max), behavior: "smooth" });
  };

  const flecha =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/80 transition hover:border-primary/50 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-black uppercase tracking-[0.1em] text-white sm:text-sm sm:tracking-[0.14em]">{titulo}</h2>
        <div className="flex shrink-0 items-center gap-3">
          {accion}
          <div className="hidden items-center gap-1.5 [@media(hover:hover)]:flex">
            <button type="button" onClick={() => mover(-1)} disabled={!puedeAtras} aria-label="Anterior" className={flecha}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button type="button" onClick={() => mover(1)} disabled={!puedeAdelante} aria-label="Siguiente" className={flecha}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div
        ref={ref}
        role="region"
        aria-label={titulo}
        className={`no-scrollbar snap-x snap-mandatory overflow-x-auto overscroll-x-contain ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
