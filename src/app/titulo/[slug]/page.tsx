import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getPedidoConfig } from "@/lib/catalog";
import { getParecidos, getTituloPorRuta } from "@/lib/catalogQuery";
import { CATEGORIAS } from "@/lib/categories";
import { rutaTitulo } from "@/lib/format";
import { posterImg } from "@/lib/poster";
import { SITE } from "@/lib/site";
import FichaTitulo from "@/components/ficha/FichaTitulo";
import PosterCard from "@/components/home/PosterCard";
import { GRID_POSTERS } from "@/components/home/catalogo/grid";

// Cada ficha se genera la primera vez que alguien la abre y queda en la CDN (5 min, o hasta que se guarde en el panel).
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const resumen = (t: string | null | undefined, max = 155) => {
  const s = (t ?? "").replace(/\s+/g, " ").trim();
  return s.length <= max ? s : `${s.slice(0, s.lastIndexOf(" ", max))}…`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await getTituloPorRuta((await params).slug);
  if (!m) return { title: "Título no encontrado" };
  const titulo = `${m.title.trim()} (${m.year})`;
  const descripcion = resumen(m.synopsis) || `${m.category} del Paquete Semanal ${SITE.name}.`;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: rutaTitulo(m) },
    // Al pegar el enlace en WhatsApp sale el póster.
    openGraph: {
      title: titulo,
      description: descripcion,
      url: rutaTitulo(m),
      type: "video.movie",
      images: m.poster_url ? [{ url: m.poster_url, alt: `Póster de ${m.title.trim()}` }] : undefined,
    },
  };
}

export default async function TituloPage({ params }: Props) {
  const { slug } = await params;
  const m = await getTituloPorRuta(slug);
  if (!m) notFound();
  // Enlace viejo por id: lleva a la dirección definitiva con el nombre.
  if (m.slug && decodeURIComponent(slug) !== m.slug) permanentRedirect(rutaTitulo(m));

  const [config, parecidos] = await Promise.all([getPedidoConfig(), getParecidos(m, 12)]);
  const cat = CATEGORIAS.find((c) => c.categorias.includes(m.category));

  // Datos estructurados para buscadores (película o serie).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": m.seasons ? "TVSeries" : "Movie",
    name: m.title.trim(),
    datePublished: String(m.year),
    description: resumen(m.synopsis, 300) || undefined,
    image: m.poster_url ?? undefined,
    genre: m.genre || undefined,
    url: `${SITE.url}${rutaTitulo(m)}`,
    ...(m.rating_count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(m.rating_avg).toFixed(1), ratingCount: m.rating_count, bestRating: 5, worstRating: 1 } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="relative isolate overflow-hidden">
        {/* Fondo: el póster muy difuminado le da el color de cada título */}
        {m.poster_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...posterImg(m, "mini")} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-20 blur-3xl" />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/80 to-background" />

        <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
          <nav aria-label="Ruta" className="mb-5 truncate text-xs font-semibold text-accent">
            <Link href="/" className="hover:text-white">Inicio</Link>
            {cat && (
              <>
                <span aria-hidden="true" className="mx-1.5 text-white/30">›</span>
                <Link href={`/category/${cat.slug}`} className="hover:text-white">{cat.label}</Link>
              </>
            )}
            <span aria-hidden="true" className="mx-1.5 text-white/30">›</span>
            <span className="text-white/80">{m.title.trim()}</span>
          </nav>
          <FichaTitulo media={m} variante="pagina" config={config} />
        </div>
      </section>

      {parecidos.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10" aria-labelledby="titulo-parecidos">
          <h2 id="titulo-parecidos" className="mb-5 text-xl font-black tracking-tight text-white sm:text-2xl">
            Si te gustó, <span className="text-primary">mira también</span>
          </h2>
          <ul className={GRID_POSTERS}>
            {parecidos.map((p) => (
              <li key={p.id}>
                <PosterCard media={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
