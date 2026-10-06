import type { HomeMedia } from "@/lib/catalog";
import PedidoToggle from "@/components/pedido/PedidoToggle";
import OpenMedia from "./OpenMedia";

// Tarjeta de catálogo: póster 2:3, cinta ESTRENO, año, categoría, título, calificación real y ＋ pedido.
export default function PosterCard({ media, eager = false }: { media: HomeMedia; eager?: boolean }) {
  const votos = Number(media.rating_count ?? 0);
  return (
    <div className="group relative">
      <OpenMedia media={media} label={`Ver ficha de ${media.title}`} className="block w-full text-left">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-surface-2 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-[0_18px_40px_-18px_rgba(249,195,164,0.35)]">
          {media.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.poster_url}
              alt={media.title}
              width={190}
              height={285}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center text-xs font-bold text-white/40">{media.title}</div>
          )}

          {media.estreno && (
            <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 overflow-hidden">
              <span className="absolute -right-7 top-3.5 w-28 rotate-45 bg-gradient-to-r from-red-600 to-orange-500 py-0.5 text-center text-[9px] font-black uppercase tracking-widest text-white shadow-md">
                Estreno
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/85">
            {media.category}
          </span>
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-black text-amber-400">
            {media.year}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-[13px] font-bold leading-snug text-white/90 transition-colors group-hover:text-primary">
          {media.title.trim()}
        </h3>
        {votos > 0 && (
          <p className="mt-0.5 text-[11px] font-semibold text-amber-300/90">
            ⭐ {Number(media.rating_avg).toFixed(1)} <span className="text-white/40">· {votos} {votos === 1 ? "voto" : "votos"}</span>
          </p>
        )}
      </OpenMedia>

      {/* Fuera del botón de la ficha (no se anidan botones); sigue el desplazamiento del hover */}
      <PedidoToggle media={media} className="absolute left-2 top-2 transition-transform duration-300 group-hover:-translate-y-1" />
    </div>
  );
}
