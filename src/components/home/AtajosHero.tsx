"use client";

import { FILTROS_VACIOS, type FiltrosCatalogo } from "@/lib/categories";
import { EVENTO_FILTRAR } from "./catalogo/Catalogo";

type Atajo = { emoji: string; texto: string; filtro?: Partial<FiltrosCatalogo>; ancla?: string };

const ATAJOS: Atajo[] = [
  { emoji: "🍿", texto: "Películas de Cine", filtro: { cat: "peliculas" } },
  { emoji: "📺", texto: "Series de Estreno", filtro: { cat: "series", estreno: true } },
  { emoji: "🔥", texto: "Lo Más Pedido", ancla: "top10" },
];

/**
 * Chips del Hero. Los de filtro avisan al catálogo (que filtra y baja suave hasta él);
 * "Lo Más Pedido" baja al Top 10. Sin JS, los enlaces llevan igual al lugar correcto.
 */
export default function AtajosHero() {
  const ir = (e: React.MouseEvent, a: Atajo) => {
    if (a.ancla) {
      const destino = document.getElementById(a.ancla);
      if (!destino) return; // sin Top 10 (pocos votos): el enlace sigue a su href
      e.preventDefault();
      destino.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    e.preventDefault();
    window.dispatchEvent(new CustomEvent(EVENTO_FILTRAR, { detail: { ...FILTROS_VACIOS, ...a.filtro } }));
  };

  const href = (a: Atajo) => {
    if (a.ancla) return `#${a.ancla}`;
    const p = new URLSearchParams();
    if (a.filtro?.cat) p.set("cat", a.filtro.cat);
    if (a.filtro?.estreno) p.set("estreno", "1");
    return `/?${p}#catalogo`;
  };

  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {ATAJOS.map((a) => (
        <li key={a.texto}>
          <a
            href={href(a)}
            onClick={(e) => ir(e, a)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] font-bold text-white/85 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:text-white active:scale-[0.97]"
          >
            <span aria-hidden="true" className="text-base leading-none">{a.emoji}</span>
            {a.texto}
          </a>
        </li>
      ))}
    </ul>
  );
}
