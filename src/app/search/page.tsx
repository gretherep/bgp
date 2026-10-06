import type { Metadata } from "next";
import Link from "next/link";
import { getPedidoConfig } from "@/lib/catalog";
import { MAX_RESULTADOS, buscarCatalogo, getCatalogo } from "@/lib/catalogQuery";
import { CATEGORIAS, FILTROS_VACIOS } from "@/lib/categories";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import PosterCard from "@/components/home/PosterCard";
import { GRID_POSTERS } from "@/components/home/catalogo/grid";
import BuscadorEnVivo from "./BuscadorEnVivo";

type Props = { searchParams: Promise<{ query?: string; q?: string }> };

const leer = (sp: { query?: string; q?: string }) => (sp.query ?? sp.q ?? "").trim().slice(0, 80);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = leer(await searchParams);
  // Las páginas de resultados no se indexan en buscadores.
  return { title: q ? `«${q}» · Buscar` : "Buscar", robots: { index: false, follow: true } };
}

export default async function BuscarPage({ searchParams }: Props) {
  const q = leer(await searchParams);
  const buscando = q.length >= 2;
  const [resultados, config] = await Promise.all([buscando ? buscarCatalogo(q) : Promise.resolve([]), getPedidoConfig()]);
  const sinResultados = buscando && resultados.length === 0;
  // Sin búsqueda o sin resultados: lo último que entró, en vez de una página vacía.
  const sugeridos = buscando && !sinResultados ? [] : (await getCatalogo({ ...FILTROS_VACIOS, orden: "recientes" }, 1)).items.slice(0, sinResultados ? 12 : 18);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-center text-2xl font-black tracking-tight text-white sm:text-3xl">
          {q ? "Buscar" : "¿Qué quieres ver?"}
        </h1>
        <BuscadorEnVivo inicial={q} />
        <ul className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
          {CATEGORIAS.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link
                href={`/category/${c.slug}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[13px] font-bold text-white/80 transition hover:border-primary/50 hover:text-white"
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Resultados ───────────────────────────────────────────────── */}
      {buscando && resultados.length > 0 && (
        <section className="mt-10" aria-labelledby="titulo-resultados">
          <h2 id="titulo-resultados" className="mb-5 flex flex-wrap items-baseline gap-x-3 text-xl font-black tracking-tight text-white sm:text-2xl">
            Resultados para <span className="text-primary">«{q}»</span>
            <span className="text-sm font-semibold text-accent" aria-live="polite">
              {resultados.length >= MAX_RESULTADOS ? `más de ${MAX_RESULTADOS - 1}` : resultados.length} {resultados.length === 1 ? "título" : "títulos"}
            </span>
          </h2>
          <ul className={GRID_POSTERS}>
            {resultados.map((m) => (
              <li key={m.id}>
                <PosterCard media={m} />
              </li>
            ))}
          </ul>
          {resultados.length >= MAX_RESULTADOS && (
            <p className="mt-8 text-center text-sm text-accent">Hay más resultados: escribe un poco más del nombre para afinar la búsqueda.</p>
          )}
        </section>
      )}

      {q.length === 1 && <p className="mt-8 text-center text-sm text-accent">Escribe al menos 2 letras.</p>}

      {/* ── Sin resultados: que lo pida igual ────────────────────────── */}
      {sinResultados && (
        <section className="mx-auto mt-10 max-w-2xl rounded-3xl border border-dashed border-white/15 px-6 py-10 text-center">
          <p className="text-3xl" aria-hidden="true">🔎</p>
          <h2 className="mt-2 text-xl font-black text-white">
            No tenemos <span className="text-primary">«{q}»</span> en el catálogo
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/65">
            Revisa cómo está escrito, o pídelo igual: te confirmamos por WhatsApp si lo podemos conseguir.
          </p>
          <a
            href={waLink(config.whatsappUrl, `Hola 👋 busco «${q}», no lo encontré en el catálogo. ¿Me lo pueden conseguir?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-sm font-black text-black transition hover:brightness-110 active:scale-[0.97]"
          >
            <WhatsAppIcon className="h-4 w-4" /> Pedir «{q.length > 24 ? `${q.slice(0, 24)}…` : q}»
          </a>
        </section>
      )}

      {/* ── Sin búsqueda o sin resultados: lo último que entró ───────── */}
      {sugeridos.length > 0 && (
        <section className="mt-12" aria-labelledby="titulo-sugeridos">
          <h2 id="titulo-sugeridos" className="mb-5 text-xl font-black tracking-tight text-white sm:text-2xl">
            {sinResultados ? "Quizás te interese" : <>Lo último que <span className="text-primary">entró</span></>}
          </h2>
          <ul className={GRID_POSTERS}>
            {sugeridos.map((m) => (
              <li key={m.id}>
                <PosterCard media={m} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
