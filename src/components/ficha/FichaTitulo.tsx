"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { HomeMedia, PedidoConfig } from "@/lib/catalog";
import { CATEGORIAS } from "@/lib/categories";
import { generosCortos, idiomaLegible, rutaTitulo } from "@/lib/format";
import { posterImg } from "@/lib/poster";
import { precioItem } from "@/lib/precios";
import { SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";
import { usePedidoConfig } from "@/hooks/usePedidoConfig";
import { useToast } from "@/app/context/ToastContext";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import PedidoToggle from "@/components/pedido/PedidoToggle";

// Las estrellas para votar traen Supabase: se cargan después, sin frenar la ficha.
const Votar = dynamic(() => import("./Votar"), {
  ssr: false,
  loading: () => <div className="h-9 w-44 animate-pulse rounded-lg bg-white/[0.06]" aria-hidden="true" />,
});

/**
 * Ficha de un título: la usan la ventanita (MediaModal, `modal`) y la página /titulo/<slug> (`pagina`).
 * En la página el título es <h1> y la sinopsis va completa; en la ventanita hay un enlace a la página.
 */
export default function FichaTitulo({
  media: m,
  variante,
  config: configInicial,
}: {
  media: HomeMedia;
  variante: "modal" | "pagina";
  config?: PedidoConfig | null;
}) {
  const config = usePedidoConfig(configInicial);
  const { showToast } = useToast();
  const [sinPoster, setSinPoster] = useState(!m.poster_url);

  const titulo = m.title.trim();
  const cat = CATEGORIAS.find((c) => c.categorias.includes(m.category));
  const ruta = rutaTitulo(m);
  const enlace = `${SITE.url}${ruta}`;
  const precio = config ? precioItem(m.category, m.seasons ?? null, config.precios) : null;
  const idioma = idiomaLegible(m.idioma);
  const generos = generosCortos(m.genre, 4);
  const temporadas = m.seasons ? `${m.seasons} ${Number(m.seasons) === 1 ? "temporada" : "temporadas"}` : null;
  const Titulo = variante === "pagina" ? "h1" : "h2";

  const pedir = waLink(config?.whatsappUrl ?? null, `Hola 👋 quiero: *${titulo}* (${m.year}) – ${m.category}\n${enlace}`);

  const compartir = async () => {
    const datos = { title: `${titulo} (${m.year})`, text: `Mira «${titulo}» en ${SITE.name}`, url: enlace };
    try {
      if (navigator.share) return await navigator.share(datos);
      await navigator.clipboard.writeText(enlace);
      showToast("Enlace copiado", false, 1800);
    } catch (e) {
      // Cerrar el menú de compartir no es un error.
      if ((e as Error).name !== "AbortError") showToast("No se pudo compartir", true);
    }
  };

  return (
    // Áreas: móvil = póster / datos / calificar (una columna). sm+ = póster y calificar a la izquierda,
    // datos a la derecha: así la columna del póster no deja un hueco debajo cuando los datos son largos.
    <div className="grid gap-5 [grid-template-areas:'poster''info''extra'] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:grid-rows-[auto_1fr] sm:gap-x-8 sm:gap-y-5 sm:[grid-template-areas:'poster_info''extra_info']">
      {/* Póster. En la ventanita del móvil, más chico: así "Pedir por WhatsApp" entra en la primera pantalla. */}
      <div className={`mx-auto w-full [grid-area:poster] sm:max-w-none ${variante === "modal" ? "max-w-[150px]" : "max-w-[260px]"}`}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-surface-2 shadow-2xl shadow-black/60">
          {sinPoster ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="text-4xl" aria-hidden="true">🎬</span>
              <span className="mt-2 text-xs font-bold text-accent">Sin póster</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...posterImg(m, "grande", variante === "modal" ? "(min-width: 640px) 280px, 150px" : "(min-width: 1024px) 380px, (min-width: 640px) 40vw, 260px")} alt={`Póster de ${titulo}`} width={400} height={600} decoding="async" fetchPriority={variante === "pagina" ? "high" : undefined} className="h-full w-full object-cover" onError={() => setSinPoster(true)} />
          )}
          {m.estreno && (
            <span className="absolute left-3 top-3 rounded-md bg-gradient-to-r from-red-600 to-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
              Estreno
            </span>
          )}
        </div>
      </div>

      {/* Datos */}
      <div className="flex min-w-0 flex-col [grid-area:info]">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">
          {cat ? (
            <Link href={`/category/${cat.slug}`} className="text-primary hover:underline">
              {m.category}
            </Link>
          ) : (
            m.category
          )}
          <span aria-hidden="true" className="mx-1.5 text-white/25">·</span>
          {m.year}
          {temporadas && (
            <>
              <span aria-hidden="true" className="mx-1.5 text-white/25">·</span>
              {temporadas}
            </>
          )}
        </p>
        <Titulo className="mt-2 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">{titulo}</Titulo>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {m.rating_count > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-black text-amber-300">
              ⭐ {Number(m.rating_avg).toFixed(1)} / 5
              <span className="font-semibold text-amber-300/60">
                · {m.rating_count} {m.rating_count === 1 ? "voto" : "votos"}
              </span>
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-white/60">Sin votos todavía</span>
          )}
          {generos.map((g) => (
            <span key={g} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-white/75">
              {g}
            </span>
          ))}
        </div>

        {idioma && <p className="mt-3 text-sm text-white/70">🗣️ {idioma}</p>}

        <p className={`mt-4 whitespace-pre-line text-sm leading-relaxed text-white/80 sm:text-[15px] ${variante === "modal" ? "line-clamp-6" : ""}`}>
          {m.synopsis?.trim() || "Sinopsis no disponible."}
        </p>

        {/* Precio en una línea */}
        <p className="mt-5 flex flex-wrap items-baseline gap-x-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-accent">Precio</span>
          <span className="text-base font-black text-white">
            {precio ? precio.texto : <span className="inline-block h-4 w-32 animate-pulse rounded bg-white/[0.06] align-middle" aria-label="Cargando precio" />}
          </span>
        </p>

        {/* Acciones. Móvil: WhatsApp a todo el ancho y debajo "Al pedido" + compartir. sm+: una sola fila. */}
        <div className="mt-4 flex flex-wrap gap-2 sm:flex-nowrap">
          <a
            href={pedir}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex basis-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-whatsapp px-4 py-3 text-sm font-black text-black shadow-lg shadow-whatsapp/20 transition hover:brightness-110 active:scale-[0.97] sm:basis-auto sm:px-5"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" /> Pedir por WhatsApp
          </a>
          <PedidoToggle media={m} variante="boton" className="flex-1 justify-center sm:flex-none" />
          <button
            type="button"
            onClick={compartir}
            aria-label="Compartir"
            title="Compartir"
            className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-white transition hover:border-white/30 hover:bg-white/[0.06] active:scale-[0.97]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calificar y ficha completa: debajo del póster en sm+, al final en el móvil */}
      <div className="min-w-0 self-start border-t border-white/10 pt-4 [grid-area:extra] sm:rounded-2xl sm:border sm:bg-white/[0.03] sm:p-4">
        <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-accent">¿La viste? Califícala</p>
        <Votar mediaId={m.id} titulo={titulo} />
        {variante === "modal" && (
          <a href={ruta} className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-bold text-primary underline-offset-4 hover:underline">
            Ver la ficha completa →
          </a>
        )}
      </div>
    </div>
  );
}
