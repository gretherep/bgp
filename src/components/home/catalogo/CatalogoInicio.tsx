"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIAS,
  FILTROS_VACIOS,
  GENEROS,
  ORDENES,
  aniosFiltro,
  cuentaFiltrosActivos,
  filtrosAParams,
  filtrosDesdeParams,
  type FiltrosCatalogo,
} from "@/lib/categories";
import type { HomeMedia } from "@/lib/catalog";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import PosterCard from "../PosterCard";
import Chip from "./Chip";
import FilterSheet from "./FilterSheet";
import FiltroPopover from "./FiltroPopover";

export const EVENTO_FILTRAR = "bgp:filtrar";

type Pagina = { items: HomeMedia[]; total: number; page: number; pageSize: number };

const GRID =
  // 2 columnas en móvil, 4 en tablet, 6 en 1024, 7 en 1280–1440 y 8 en 1920 (nunca menos de 140 px).
  "grid gap-x-3 gap-y-5 sm:gap-x-4 [grid-template-columns:repeat(auto-fill,minmax(clamp(140px,11.5vw,172px),1fr))]";

export default function CatalogoInicio({ inicial, whatsappUrl }: { inicial: Pagina; whatsappUrl: string | null }) {
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(FILTROS_VACIOS);
  const [items, setItems] = useState<HomeMedia[]>(inicial.items);
  const [total, setTotal] = useState(inicial.total);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState<"filtro" | "mas" | null>(null);
  const [error, setError] = useState(false);
  const [sheet, setSheet] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const seccion = useRef<HTMLElement>(null);

  const pedir = useCallback(async (f: FiltrosCatalogo, p: number): Promise<Pagina | null> => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    const qs = filtrosAParams(f);
    qs.set("page", String(p));
    try {
      const res = await fetch(`/api/catalog?${qs}`, { signal: c.signal });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as Pagina;
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(true);
      return null;
    }
  }, []);

  const aplicar = useCallback(
    async (f: FiltrosCatalogo) => {
      setFiltros(f);
      setError(false);
      // La URL refleja los filtros (se puede compartir); replaceState no recarga la página.
      const qs = filtrosAParams(f).toString();
      history.replaceState(history.state, "", qs ? `/?${qs}#catalogo` : "/#catalogo");
      if (cuentaFiltrosActivos(f) === 0) {
        setItems(inicial.items);
        setTotal(inicial.total);
        setPage(1);
        return;
      }
      setCargando("filtro");
      const r = await pedir(f, 1);
      if (r) {
        setItems(r.items);
        setTotal(r.total);
        setPage(1);
      }
      setCargando(null);
    },
    [inicial, pedir],
  );

  const cargarMas = async () => {
    setCargando("mas");
    const r = await pedir(filtros, page + 1);
    if (r) {
      setItems((prev) => [...prev, ...r.items.filter((n) => !prev.some((x) => x.id === n.id))]);
      setTotal(r.total);
      setPage(page + 1);
    }
    setCargando(null);
  };

  // Filtros que llegan en la URL (enlace compartido) o desde los chips de "¿Qué quieres ver hoy?".
  useEffect(() => {
    const desdeUrl = filtrosDesdeParams(new URLSearchParams(window.location.search));
    if (cuentaFiltrosActivos(desdeUrl) > 0) aplicar(desdeUrl);

    const onFiltrar = (e: Event) => {
      const detalle = (e as CustomEvent<Partial<FiltrosCatalogo>>).detail;
      aplicar({ ...FILTROS_VACIOS, ...detalle });
      seccion.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener(EVENTO_FILTRAR, onFiltrar);
    return () => window.removeEventListener(EVENTO_FILTRAR, onFiltrar);
  }, [aplicar]);

  const activos = cuentaFiltrosActivos(filtros);
  const anios = aniosFiltro();
  const catLabel = CATEGORIAS.find((c) => c.slug === filtros.cat)?.label;
  const anioLabel = anios.find((a) => a.slug === filtros.anio)?.label;
  const ordenLabel = ORDENES.find((o) => o.slug === filtros.orden)?.label;
  const quedan = Math.max(total - items.length, 0);

  const quitar = (cambio: Partial<FiltrosCatalogo>) => aplicar({ ...filtros, ...cambio });
  const toggleGenero = (slug: string) =>
    quitar({ generos: filtros.generos.includes(slug) ? filtros.generos.filter((g) => g !== slug) : [...filtros.generos, slug] });

  // Chips de filtros activos (removibles)
  const chipsActivos = [
    ...(catLabel ? [{ key: "cat", label: catLabel, quitar: () => quitar({ cat: null }) }] : []),
    ...(anioLabel ? [{ key: "anio", label: anioLabel, quitar: () => quitar({ anio: null }) }] : []),
    ...filtros.generos.map((g) => {
      const gen = GENEROS.find((x) => x.slug === g);
      return { key: `g-${g}`, label: `${gen?.emoji ?? ""} ${gen?.label ?? g}`, quitar: () => toggleGenero(g) };
    }),
    ...(filtros.orden !== "estrenos" ? [{ key: "orden", label: ordenLabel ?? "", quitar: () => quitar({ orden: "estrenos" }) }] : []),
  ];

  return (
    <section ref={seccion} id="catalogo" className="mx-auto max-w-[1600px] scroll-mt-20 px-4 pb-14 sm:px-6 lg:px-10">
      {/* ── Barra de filtros ─────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-white/5 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        <div className="flex items-center gap-2">
          {/* Móvil / tablet: un solo botón que abre la hoja */}
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[13px] font-bold text-white lg:hidden"
          >
            🎛️ Filtros
            {activos > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] font-black text-black">{activos}</span>}
          </button>

          {/* PC: chips desplegables */}
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <FiltroPopover label="Categorías" valor={catLabel} activo={!!filtros.cat} ancho="w-72">
              {(cerrar) => (
                <div className="flex flex-wrap gap-2">
                  <Chip activo={!filtros.cat} onClick={() => { quitar({ cat: null }); cerrar(); }}>Todas</Chip>
                  {CATEGORIAS.map((c) => (
                    <Chip key={c.slug} activo={filtros.cat === c.slug} onClick={() => { quitar({ cat: c.slug }); cerrar(); }}>
                      {c.label}
                    </Chip>
                  ))}
                </div>
              )}
            </FiltroPopover>
            <FiltroPopover label="Año" valor={anioLabel} activo={!!filtros.anio} ancho="w-72">
              {(cerrar) => (
                <div className="flex flex-wrap gap-2">
                  <Chip activo={!filtros.anio} onClick={() => { quitar({ anio: null }); cerrar(); }}>Todos</Chip>
                  {anios.map((a) => (
                    <Chip key={a.slug} activo={filtros.anio === a.slug} onClick={() => { quitar({ anio: a.slug }); cerrar(); }}>
                      {a.label}
                    </Chip>
                  ))}
                </div>
              )}
            </FiltroPopover>
            <FiltroPopover
              label="Géneros"
              valor={filtros.generos.length ? String(filtros.generos.length) : null}
              activo={filtros.generos.length > 0}
              ancho="w-[22rem]"
            >
              {(cerrar) => (
                <>
                  <div className="flex flex-wrap gap-2">
                    {GENEROS.map((g) => (
                      <Chip key={g.slug} activo={filtros.generos.includes(g.slug)} onClick={() => toggleGenero(g.slug)}>
                        <span aria-hidden="true">{g.emoji}</span> {g.label}
                      </Chip>
                    ))}
                  </div>
                  <button type="button" onClick={cerrar} className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-black text-black">
                    Listo
                  </button>
                </>
              )}
            </FiltroPopover>
            <FiltroPopover label="Ordenar por" valor={filtros.orden !== "estrenos" ? ordenLabel : null} activo={filtros.orden !== "estrenos"} ancho="w-56">
              {(cerrar) => (
                <ul className="space-y-1">
                  {ORDENES.map((o) => (
                    <li key={o.slug}>
                      <button
                        type="button"
                        onClick={() => { quitar({ orden: o.slug }); cerrar(); }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-white/5 ${filtros.orden === o.slug ? "text-primary" : "text-white/80"}`}
                      >
                        {o.label}
                        {filtros.orden === o.slug && <span aria-hidden="true">✓</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FiltroPopover>
            {chipsActivos.length > 0 && <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />}
          </div>

          {/* Filtros activos, removibles (deslizable en móvil) */}
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {chipsActivos.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.quitar}
                aria-label={`Quitar filtro ${c.label}`}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 pl-3 pr-2 text-xs font-bold text-primary transition hover:bg-primary/20"
              >
                {c.label}
                <span aria-hidden="true" className="text-sm leading-none">×</span>
              </button>
            ))}
            {activos > 1 && (
              <button type="button" onClick={() => aplicar(FILTROS_VACIOS)} className="shrink-0 px-2 text-xs font-bold text-white/50 underline-offset-4 hover:text-white hover:underline">
                Limpiar todo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Título ───────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          {activos ? "Resultados" : <>Contenido <span className="text-primary">reciente</span></>}
        </h2>
        <span className="text-sm font-semibold text-accent" aria-live="polite">
          {total} {total === 1 ? "título" : "títulos"}
        </span>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      {error && (
        <p className="mb-4 rounded-xl border border-offer/40 bg-offer/10 px-4 py-3 text-sm text-red-200">
          No se pudo cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.
        </p>
      )}

      {items.length === 0 && cargando !== "filtro" ? (
        <div className="rounded-3xl border border-dashed border-white/15 px-6 py-14 text-center">
          <p className="text-base font-bold text-white">No encontramos títulos con esos filtros</p>
          <p className="mt-1 text-sm text-accent">Si lo que buscas no está en el catálogo, te lo conseguimos.</p>
          <a
            href={waLink(whatsappUrl, "Hola 👋 busco un título que no encontré en el catálogo:")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-5 py-2.5 text-sm font-black text-black"
          >
            <WhatsAppIcon className="h-4 w-4" /> Pedir por WhatsApp
          </a>
        </div>
      ) : (
        <ul className={`${GRID} transition-opacity ${cargando === "filtro" ? "opacity-40" : ""}`} aria-busy={cargando !== null}>
          {items.map((m) => (
            <li key={m.id}>
              {/* Todo lazy: el catálogo nunca está en la primera pantalla */}
              <PosterCard media={m} />
            </li>
          ))}
          {cargando === "mas" &&
            Array.from({ length: 6 }).map((_, i) => (
              <li key={`sk-${i}`} aria-hidden="true">
                <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              </li>
            ))}
        </ul>
      )}

      {quedan > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={cargarMas}
            disabled={cargando !== null}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition hover:border-primary/50 hover:bg-white/[0.07] active:scale-[0.98] disabled:opacity-50"
          >
            {cargando === "mas" ? "Cargando…" : `Cargar más títulos · quedan ${quedan}`}
          </button>
        </div>
      )}

      {sheet && (
        <FilterSheet
          inicial={filtros}
          onCerrar={(f) => {
            setSheet(false);
            if (f) aplicar(f);
          }}
        />
      )}
    </section>
  );
}
