import type { HomeMedia } from "@/lib/catalog";
import PedidoToggle from "@/components/pedido/PedidoToggle";
import { posterImg } from "@/lib/poster";
import Carousel from "./Carousel";
import OpenMedia from "./OpenMedia";

const MIN_ITEMS = 5;

export default function Top10Row({ items, titulo = "🏆 Top 10 mejor valorados" }: { items: HomeMedia[]; titulo?: string }) {
  if (items.length < MIN_ITEMS) return null;
  return (
    // id: destino del atajo "🔥 Lo Más Pedido" del Hero (scroll-mt: no queda debajo del menú fijo).
    <section id="top10" className="mx-auto max-w-[1600px] scroll-mt-20 px-4 pb-10 sm:px-6 lg:px-10">
      <Carousel
        titulo={titulo}
        className="-mx-4 scroll-px-4 sm:-mx-6 sm:scroll-px-6 lg:mx-0 lg:scroll-px-0"
      >
        <ol className="flex w-max gap-3 px-4 pb-1 sm:gap-4 sm:px-6 lg:px-0">
          {items.map((m, i) => (
            <li key={m.id} className="group relative w-[132px] shrink-0 snap-start sm:w-[150px] xl:w-[168px]">
              <OpenMedia media={m} label={`Top ${i + 1}: ${m.title}`} className="block w-full text-left">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-surface-2 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/50">
                  {m.poster_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      {...posterImg(m, "tarjeta", "168px")}
                      alt={m.title}
                      width={168}
                      height={252}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  {/* Número de ranking grande, abajo a la izquierda */}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2 left-1.5 text-[64px] font-black leading-none tracking-tighter text-primary sm:text-[76px]"
                    style={{ WebkitTextStroke: "1.5px rgba(0,0,0,0.55)", textShadow: "0 6px 18px rgba(0,0,0,0.6)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                    ⭐ {Number(m.rating_avg).toFixed(1)}
                  </span>
                  {m.estreno && (
                    <span className="absolute left-0 top-2 rounded-r bg-offer px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-white">
                      Estreno
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 text-[12px] font-semibold text-white/85 group-hover:text-primary">{m.title}</p>
              </OpenMedia>
              <PedidoToggle media={m} className="absolute right-2 top-2 transition-transform duration-300 group-hover:-translate-y-1" />
            </li>
          ))}
        </ol>
      </Carousel>
    </section>
  );
}
