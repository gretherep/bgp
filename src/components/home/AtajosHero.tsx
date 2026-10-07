"use client";

import { FILTROS_VACIOS, type FiltrosCatalogo } from "@/lib/categories";
import type { HeroTextos } from "@/lib/hero";
import { EVENTO_FILTRAR } from "./catalogo/Catalogo";

type Atajo = { clave: keyof HeroTextos["chips"]; filtro?: Partial<FiltrosCatalogo>; ancla?: string };

// Lo que hace cada chip es fijo; el texto lo edita la admin (Portada → Texto de bienvenida).
const ATAJOS: Atajo[] = [
  { clave: "peliculas", filtro: { cat: "peliculas" } },
  { clave: "series", filtro: { cat: "series", estreno: true } },
  { clave: "top", ancla: "top10" },
];

/**
 * Chips del Hero. Los de filtro avisan al catálogo (que filtra y baja suave hasta él);
 * "Lo Más Pedido" baja al Top 10. Sin JS, los enlaces llevan igual al lugar correcto.
 */
export default function AtajosHero({ chips }: { chips: HeroTextos["chips"] }) {
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
        <li key={a.clave}>
          <a
            href={href(a)}
            onClick={(e) => ir(e, a)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] font-bold text-white/85 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:text-white active:scale-[0.97]"
          >
            {chips[a.clave]}
          </a>
        </li>
      ))}
    </ul>
  );
}
