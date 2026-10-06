import type { HomeMedia } from "@/lib/catalog";
import PedidoToggle from "@/components/pedido/PedidoToggle";
import Carousel from "./Carousel";
import OpenMedia from "./OpenMedia";

export default function NuevosRail({ items, titulo }: { items: HomeMedia[]; titulo: string }) {
  if (!items.length) return null;
  return (
    <Carousel
      titulo={titulo}
      accion={
        <a href="#catalogo" className="whitespace-nowrap text-xs font-bold text-primary underline-offset-4 hover:underline">
          Ver catálogo →
        </a>
      }
      // El scroll sangra hasta el borde de la pantalla en móvil; scroll-px mantiene el snap alineado al margen.
      className="-mx-4 scroll-px-4 sm:-mx-6 sm:scroll-px-6 lg:mx-0 lg:scroll-px-0"
    >
      <ul className="flex w-max gap-3 px-4 pb-1 sm:px-6 lg:px-0">
        {items.map((m, i) => (
          <li key={m.id} className="group relative w-[104px] shrink-0 snap-start sm:w-[118px] xl:w-[128px]">
            <OpenMedia media={m} label={`Ver ficha de ${m.title}`} className="block w-full text-left">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-primary/50">
                {m.poster_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.poster_url}
                    alt={m.title}
                    width={128}
                    height={192}
                    // Primera pantalla en móvil: ~3,5 pósters visibles
                    loading={i < 4 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
                {m.estreno && (
                  <span className="absolute left-0 top-1.5 rounded-r bg-offer px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-white">
                    Estreno
                  </span>
                )}
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1 text-[9px] font-bold text-amber-400">
                  {m.year}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold text-white/80 group-hover:text-primary">{m.title}</p>
            </OpenMedia>
            <PedidoToggle media={m} className="absolute right-1.5 top-1.5 transition-transform duration-300 group-hover:-translate-y-1" />
          </li>
        ))}
      </ul>
    </Carousel>
  );
}
