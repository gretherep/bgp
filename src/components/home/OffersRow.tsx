import type { Promo } from "@/lib/catalog";
import { tiempoRestante } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import Carousel from "./Carousel";

/** Tarjeta de una oferta. También la usa la vista previa del editor de promos. */
export function OfertaCard({ promo: p, whatsappUrl }: { promo: Promo; whatsappUrl: string | null }) {
  const restante = tiempoRestante(p.hasta);
  const href = waLink(whatsappUrl, p.cta_mensaje ?? `Hola 👋 me interesa la oferta: ${p.titulo}`);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-gradient-to-br from-offer/[0.12] via-ink/[0.03] to-transparent p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        {p.badge && (
          <span className="rounded-lg bg-offer px-2.5 py-1 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-offer/30">
            {p.badge}
          </span>
        )}
        {p.ejemplo && (
          <span className="rounded border border-dashed border-ink/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink/50">
            Ejemplo
          </span>
        )}
      </div>
      <h3 className="mt-3 text-lg font-black leading-snug text-ink">{p.titulo}</h3>
      {p.subtitulo && <p className="mt-1 text-sm text-ink/60">{p.subtitulo}</p>}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="whitespace-nowrap text-[11px] font-bold text-primary sm:text-xs">{restante ? `⏳ ${restante}` : ""}</span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-whatsapp px-3 py-2 text-xs font-black text-black transition hover:brightness-110 active:scale-[0.97]"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          {p.cta_label ?? "Lo quiero"}
        </a>
      </div>
    </article>
  );
}

export default function OffersRow({ promos, whatsappUrl }: { promos: Promo[]; whatsappUrl: string | null }) {
  if (!promos.length) return null;

  // Slider con el mismo Carousel de las otras filas: 1 tarjeta y algo de la siguiente en móvil, 2 en tablet,
  // 3 en PC; con más ofertas se desliza (dedo o flechas) en vez de abrir otra fila, y avanza sola cada 5 s.
  return (
    <section className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-10">
      <Carousel titulo="🔥 Ofertas y combos" autoplay={5000} className="-mx-4 scroll-px-4 sm:-mx-6 sm:scroll-px-6 lg:mx-0 lg:scroll-px-0">
        {/* py-1: deja sitio a la elevación del hover (el contenedor con scroll recorta en vertical) */}
        <ul className="flex gap-3 px-4 py-1 sm:px-6 lg:gap-4 lg:px-0">
          {promos.map((p) => (
            <li key={p.id} className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-2rem)/3)]">
              <OfertaCard promo={p} whatsappUrl={whatsappUrl} />
            </li>
          ))}
        </ul>
      </Carousel>
    </section>
  );
}
