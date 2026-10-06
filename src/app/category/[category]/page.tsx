import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPedidoConfig } from "@/lib/catalog";
import { getCatalogo, getTopValorados } from "@/lib/catalogQuery";
import { CATEGORIAS, FILTROS_VACIOS } from "@/lib/categories";
import { precioSuelto } from "@/lib/precios";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import NuevosRail from "@/components/home/NuevosRail";
import Top10Row from "@/components/home/Top10Row";
import Catalogo from "@/components/home/catalogo/Catalogo";
import PideloBlock from "@/components/home/PideloBlock";

// Las 6 categorías se generan en el build y la CDN las regenera cada 5 min (o al guardar en el panel).
export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ category: c.slug }));
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIAS.find((c) => c.slug === category);
  if (!cat) return {};
  return {
    title: cat.label,
    description: `${cat.label} del Paquete Semanal BGP. ${cat.incluye} Pídelas por WhatsApp con servicio a domicilio.`,
    alternates: { canonical: `/category/${cat.slug}` },
  };
}

export default async function CategoriaPage({ params }: Props) {
  const { category } = await params;
  const cat = CATEGORIAS.find((c) => c.slug === category);
  if (!cat) notFound();

  const filtros = { ...FILTROS_VACIOS, cat: cat.slug };
  const [catalogo, recientes, top, config] = await Promise.all([
    getCatalogo(filtros, 1),
    getCatalogo({ ...filtros, orden: "recientes" }, 1),
    getTopValorados(10, cat.categorias),
    getPedidoConfig(),
  ]);

  // Una categoría puede cobrarse de dos formas (Animados: película c/u y serie por temporada).
  const precios = [...new Set(cat.categorias.map((c) => precioSuelto(c, config.precios)).filter(Boolean))] as string[];
  const nuevos = recientes.items.filter((m) => m.poster_url).slice(0, 12);
  // Si todo cabe en la primera página (Reality: 15), las filas repetirían el catálogo de abajo.
  const conFilas = catalogo.total > catalogo.pageSize;

  return (
    <>
      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: "radial-gradient(60% 90% at 15% 0%, rgba(249,195,164,0.12), transparent 70%)" }}
        />
        <div className="mx-auto max-w-[1600px] px-4 pb-6 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
          <nav aria-label="Ruta" className="mb-3 text-xs font-semibold text-accent">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span aria-hidden="true" className="mx-1.5 text-white/30">›</span>
            <span className="text-white/80">{cat.label}</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                <span aria-hidden="true" className="mr-2">{cat.emoji}</span>
                {cat.label}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">{cat.incluye}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-bold text-white">
                  {catalogo.total} {catalogo.total === 1 ? "título" : "títulos"}
                </span>
                {precios.map((p) => (
                  <span key={p} className="font-bold text-primary">
                    <span aria-hidden="true" className="mr-2 text-white/25">·</span>
                    {p}
                  </span>
                ))}
              </p>
            </div>
            <a
              href={waLink(config.whatsappUrl, `Hola 👋 quiero pedir ${cat.una}:`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-sm font-black text-black transition hover:brightness-110 active:scale-[0.97]"
            >
              <WhatsAppIcon className="h-4 w-4" /> Pedir {cat.una}
            </a>
          </div>

          {/* Otras categorías: un toque para cambiar */}
          <ul className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
            {CATEGORIAS.map((c) => {
              const actual = c.slug === cat.slug;
              return (
                <li key={c.slug} className="shrink-0">
                  <Link
                    href={`/category/${c.slug}`}
                    aria-current={actual ? "page" : undefined}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13px] font-bold transition ${
                      actual ? "border-primary bg-primary text-black" : "border-white/10 bg-white/[0.04] text-white/80 hover:border-primary/50 hover:text-white"
                    }`}
                  >
                    <span aria-hidden="true">{c.emoji}</span>
                    {c.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Lo último que entró ──────────────────────────────────────── */}
      {conFilas && nuevos.length >= 4 && (
        <section className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-10">
          <NuevosRail items={nuevos} titulo={`🆕 Lo último en ${cat.label}`} />
        </section>
      )}

      {conFilas && <Top10Row items={top} titulo={`🏆 Mejor valorados en ${cat.label}`} />}

      <Catalogo
        inicial={catalogo}
        whatsappUrl={config.whatsappUrl}
        catFija={cat.slug}
        ruta={`/category/${cat.slug}`}
        titulo={
          <>
            Todo en <span className="text-primary">{cat.label}</span>
          </>
        }
      />

      <PideloBlock whatsappUrl={config.whatsappUrl} />
    </>
  );
}
