"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORIAS,
  FILTROS_VACIOS,
  GENEROS,
  ORDENES,
  aniosFiltro,
  filtrosAParams,
  type FiltrosCatalogo,
} from "@/lib/categories";
import { useHojaModal } from "@/hooks/useHojaModal";
import Chip from "./Chip";

/**
 * Hoja de filtros para móvil y tablet (desde abajo). Los cambios se aplican al tocar
 * "Ver N títulos"; el número se consulta en vivo (solo el conteo, sin traer pósters).
 * El botón "atrás" de Android la cierra.
 */
export default function FilterSheet({
  inicial,
  onCerrar,
}: {
  inicial: FiltrosCatalogo;
  onCerrar: (aplicar: FiltrosCatalogo | null) => void;
}) {
  const [f, setF] = useState<FiltrosCatalogo>(inicial);
  const [total, setTotal] = useState<number | null>(null);
  const pendiente = useRef<FiltrosCatalogo | null>(null);
  const volver = useHojaModal(() => onCerrar(pendiente.current));

  // Conteo en vivo con los filtros elegidos (debounce 300 ms).
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const qs = filtrosAParams(f);
        qs.set("solo", "total");
        const res = await fetch(`/api/catalog?${qs}`, { signal: ctrl.signal });
        if (res.ok) setTotal((await res.json()).total);
      } catch {}
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [f]);

  const cerrar = (aplicar: FiltrosCatalogo | null) => {
    pendiente.current = aplicar;
    volver();
  };

  const toggleGenero = (slug: string) =>
    setF((p) => ({ ...p, generos: p.generos.includes(slug) ? p.generos.filter((g) => g !== slug) : [...p.generos, slug] }));

  const seccion = "border-b border-white/10 px-5 py-4";
  const titulo = "mb-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-accent";

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Filtros del catálogo">
      <button type="button" aria-label="Cerrar filtros" onClick={() => cerrar(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative flex max-h-[85vh] w-full max-w-xl animate-fade-up flex-col rounded-t-3xl border border-b-0 border-white/10 bg-surface [animation-duration:220ms]">
        <span className="mx-auto mb-2 mt-3 block h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-lg font-black text-white">Filtros</h2>
          <button type="button" onClick={() => setF({ ...FILTROS_VACIOS })} className="text-sm font-bold text-primary">
            Limpiar
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          <div className={seccion}>
            <p className={titulo}>Ordenar por</p>
            <div className="flex flex-wrap gap-2">
              {ORDENES.map((o) => (
                <Chip key={o.slug} activo={f.orden === o.slug} onClick={() => setF((p) => ({ ...p, orden: o.slug }))}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className={seccion}>
            <p className={titulo}>Categoría</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <Chip key={c.slug} activo={f.cat === c.slug} onClick={() => setF((p) => ({ ...p, cat: p.cat === c.slug ? null : c.slug }))}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className={seccion}>
            <p className={titulo}>Año</p>
            <div className="flex flex-wrap gap-2">
              {aniosFiltro().map((a) => (
                <Chip key={a.slug} activo={f.anio === a.slug} onClick={() => setF((p) => ({ ...p, anio: p.anio === a.slug ? null : a.slug }))}>
                  {a.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="px-5 py-4">
            <p className={titulo}>Géneros</p>
            <div className="flex flex-wrap gap-2">
              {GENEROS.map((g) => (
                <Chip key={g.slug} activo={f.generos.includes(g.slug)} onClick={() => toggleGenero(g.slug)}>
                  <span aria-hidden="true">{g.emoji}</span> {g.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => cerrar(f)}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-black text-black transition active:scale-[0.98]"
          >
            {total === null ? "Ver títulos" : total === 0 ? "Sin resultados con estos filtros" : `Ver ${total} ${total === 1 ? "título" : "títulos"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
