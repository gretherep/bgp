import type { Recomendada } from "@/lib/catalog";
import { generosCortos, razonesSugeridas } from "@/lib/format";
import { precioSuelto, type Precio } from "@/lib/precios";
import { SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import PedidoToggle from "@/components/pedido/PedidoToggle";
import { posterImg } from "@/lib/poster";
import OpenMedia from "./OpenMedia";

// Respaldo cuando el admin no escribió razones: las 3 primeras sacadas de los datos.
const razonesDeRespaldo = ({ media }: Recomendada) => razonesSugeridas(media, SITE.paqueteTamano).slice(0, 3);

function Calificacion({ reco }: { reco: Recomendada }) {
  const { media } = reco;
  if (media.rating_count > 0) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-black text-amber-300">
        ⭐ {Number(media.rating_avg).toFixed(1)} / 5
        <span className="font-semibold text-amber-300/60">
          · {media.rating_count} {media.rating_count === 1 ? "voto" : "votos"}
        </span>
      </span>
    );
  }
  // Un estreno ya lleva la cinta ESTRENO en el póster: no se repite aquí.
  if (media.estreno) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-offer/40 bg-offer/15 px-2.5 py-1 text-[11px] font-black text-red-300">
      ✨ Nuevo en el catálogo
    </span>
  );
}

const CintaEstreno = () => (
  <span className="absolute left-0 top-2.5 z-10 rounded-r-md bg-offer px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white lg:top-4 lg:px-2.5 lg:text-[10px]">
    Estreno
  </span>
);

/**
 * Recomendada de la semana.
 * - Móvil y tablet: tarjeta de altura natural (póster chico + texto, CTA a todo el ancho en móvil).
 * - PC (lg+): se estira a la altura de la columna izquierda del Hero. Para que nunca queden huecos
 *   (p. ej. con poco texto), la sinopsis llena el alto que sobre (desvaneciéndose si no cabe entera),
 *   y desde xl el póster ocupa todo el lado izquierdo de borde a borde (en lg va chico al lado: a 1024 px
 *   no hay ancho para las dos cosas).
 */
export default function RecomendadaCard({
  reco,
  whatsappUrl,
  precios,
}: {
  reco: Recomendada;
  whatsappUrl: string | null;
  precios: Precio[];
}) {
  const { media } = reco;
  const razones = reco.razones.length ? reco.razones : razonesDeRespaldo(reco);
  const chips = [String(media.year), media.category, ...generosCortos(media.genre)].filter(Boolean);
  const precio = precioSuelto(media.category, precios);
  const pedido = waLink(whatsappUrl, `Hola 👋 quiero: *${media.title}* (${media.year}) – ${media.category}`);
  const sinopsis = media.synopsis?.trim() || null;
  // En la destacada automática la frase es un recorte de la sinopsis: desde lg, donde se ve la
  // sinopsis completa, la frase se oculta para no repetir el texto.
  const fraseSoloMovil = !reco.elegida && !!sinopsis;

  const check = (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
    </svg>
  );

  return (
    <article className="relative isolate flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] xl:flex-row">
      {/* Fondo: el mismo póster ya descargado, desenfocado. Solo desde sm para no cargar GPU en móviles modestos. */}
      {media.poster_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...posterImg(media, "mini")}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden h-full w-full scale-125 object-cover opacity-30 blur-2xl sm:block"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/30 via-surface/80 to-surface" />

      {/* PC (xl+): póster a toda la altura, de borde a borde. Ancho = 2/3 del alto, con tope (42 %, 46 % desde 2xl) para dejar sitio al texto. */}
      <OpenMedia
        media={media}
        label={`Ver ficha de ${media.title}`}
        className="group relative hidden shrink-0 self-stretch overflow-hidden bg-surface-2 xl:block xl:aspect-[2/3] xl:max-w-[42%] 2xl:max-w-[46%]"
      >
        {media.poster_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            {...posterImg(media, "grande", "(min-width: 1280px) 420px, 1px")}
            alt={media.title}
            width={400}
            height={600}
            // lazy: por debajo de 1280 px está oculto y no se descarga; en PC está a la vista y carga enseguida
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {/* Funde el borde derecho del póster con el fondo de la tarjeta */}
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-black/40" />
        {media.estreno && <CintaEstreno />}
      </OpenMedia>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary sm:text-[11px]">
            ⭐ {reco.elegida ? "La recomendada de la semana" : "Destacada de la semana"}
          </p>
          <Calificacion reco={reco} />
        </div>

        {/* Cuerpo. Móvil/tablet: póster chico al lado, centrado. PC: el texto arriba y la sinopsis llena el resto. */}
        <div className="flex min-h-0 flex-1 items-start gap-4 p-4 sm:items-center sm:gap-6 sm:p-6 lg:items-stretch">
          <OpenMedia
            media={media}
            label={`Ver ficha de ${media.title}`}
            className="group relative w-[118px] shrink-0 self-start overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/15 transition-transform duration-300 hover:-translate-y-1 sm:w-[176px] sm:self-center lg:w-[150px] lg:self-start xl:hidden"
          >
            <div className="aspect-[2/3] bg-surface-2">
              {media.poster_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  {...posterImg(media, "grande", "(min-width: 1024px) 150px, (min-width: 640px) 176px, 118px")}
                  alt={media.title}
                  width={228}
                  height={342}
                  // lazy: desde 1280 px este póster está oculto (va el de borde a borde) y así no se descarga
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            {media.estreno && <CintaEstreno />}
          </OpenMedia>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <h2 className="line-clamp-3 text-xl font-black leading-tight tracking-tight text-white sm:text-2xl xl:text-[1.9rem]">
              {media.title}
            </h2>

            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <li key={c} className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold text-white/75">
                  {c}
                </li>
              ))}
            </ul>

            {reco.frase && (
              <p className={`mt-3 line-clamp-3 text-sm leading-relaxed text-white/80 sm:line-clamp-4 xl:line-clamp-5 ${fraseSoloMovil ? "lg:hidden" : ""}`}>
                “{reco.frase}”
              </p>
            )}

            <ul className="mt-4 hidden space-y-2 sm:block">
              {razones.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px] font-medium text-white/80">
                  {check}
                  {r}
                </li>
              ))}
            </ul>

            {/* PC: la sinopsis ocupa el alto libre; si no cabe, se desvanece abajo (si cabe, el desvanecido cae en vacío).
                basis-0: no aporta altura propia, así nunca estira la tarjeta (solo llena lo que sobra). */}
            {sinopsis && (
              <div className="relative mt-4 hidden min-h-0 flex-1 basis-0 overflow-hidden lg:block [mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)]">
                <p className="text-[11px] font-black uppercase tracking-wider text-accent">De qué trata</p>
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-white/65">{sinopsis}</p>
              </div>
            )}

            {precio && (
              <p className="mt-4 hidden shrink-0 items-center gap-1.5 self-start rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary sm:inline-flex">
                💰 {precio}
              </p>
            )}

            <div className="mt-5 hidden shrink-0 flex-wrap gap-2 sm:flex">
              <a
                href={pedido}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-black text-black shadow-lg shadow-whatsapp/20 transition hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.97] xl:px-5"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Pídela ya
              </a>
              <PedidoToggle media={media} variante="boton" />
              <OpenMedia
                media={media}
                className="inline-flex items-center whitespace-nowrap rounded-xl px-2 py-2.5 text-sm font-bold text-white/70 underline-offset-4 transition hover:text-white hover:underline"
              >
                Ver ficha
              </OpenMedia>
            </div>
          </div>
        </div>

        {/* Pie (sm+): cierra la tarjeta con información útil en lugar de dejar espacio vacío */}
        <div className="hidden flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/10 px-6 py-3 text-xs text-accent sm:flex">
          <span>📦 Incluida en el paquete semanal de {SITE.paqueteTamano}</span>
          <span>💬 Te respondemos por WhatsApp</span>
        </div>

        {/* Móvil: razones, precio y CTA a todo el ancho debajo del póster */}
        <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:hidden">
          <ul className="space-y-1.5">
            {razones.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] text-white/80">
                {check}
                {r}
              </li>
            ))}
          </ul>
          {precio && <p className="mt-2.5 text-xs font-bold text-primary">💰 {precio}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={pedido}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-whatsapp py-2.5 text-[13px] font-black text-black active:scale-[0.97]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Pídela ya
            </a>
            <PedidoToggle media={media} variante="boton" className="text-[13px]" />
          </div>
          <OpenMedia media={media} className="mt-2 w-full py-1.5 text-center text-xs font-bold text-white/60 underline-offset-4 hover:underline">
            Ver ficha completa
          </OpenMedia>
        </div>
      </div>
    </article>
  );
}
