"use client";

import { useSyncExternalStore } from "react";
import type { Promo } from "@/lib/catalog";

const KEY = "bgp:promo-cerrada";
const listeners = new Set<() => void>();

function leerCerrada(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function suscribir(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export default function PromoStrip({ promo, href }: { promo: Promo; href: string }) {
  // En el servidor (null) se muestra siempre; en el cliente se oculta si ya se cerró esta promo.
  const cerradaId = useSyncExternalStore(suscribir, leerCerrada, () => null);
  if (cerradaId === promo.id) return null;

  const cerrar = () => {
    try {
      localStorage.setItem(KEY, promo.id);
    } catch {}
    listeners.forEach((l) => l());
  };

  return (
    <div className="relative border-b border-white/10 bg-gradient-to-r from-primary/[0.14] via-primary/[0.07] to-primary/[0.14]">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group mx-auto flex min-h-10 max-w-[1600px] items-center justify-center gap-2.5 py-2 pl-4 pr-11 text-[13px] leading-snug text-white sm:px-12 sm:text-sm"
      >
        {promo.badge && (
          <span className="shrink-0 rounded-md bg-offer px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
            {promo.badge}
          </span>
        )}
        {/* En móvil puede ocupar 2 líneas: mejor que cortar el precio */}
        <span className="font-semibold sm:truncate">{promo.titulo}</span>
        {promo.subtitulo && <span className="hidden truncate text-white/60 md:inline">· {promo.subtitulo}</span>}
        <span className="hidden shrink-0 font-bold text-primary underline-offset-4 group-hover:underline sm:inline">
          {promo.cta_label ?? "Lo quiero"} →
        </span>
      </a>
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar promoción"
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
