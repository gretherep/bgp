import "server-only";
import { createServerClient } from "@/utils/supabaseServer";
import type { Media } from "@/app/models/media";
import type { Precio } from "./precios";

// Campos que necesitan la tarjeta y el modal de detalle. Nunca "*": la tabla puede crecer.
const MEDIA_FIELDS =
  "id,slug,title,synopsis,poster_url,poster_thumb_url,poster_md_url,poster_full_url,poster_color,genre,year,category,estreno,idioma,seasons,created_at,updated_at,rating_avg,rating_count";

export type HomeMedia = Media & { rating_avg: number; rating_count: number };

export type Promo = {
  id: string;
  kind: "strip" | "card";
  titulo: string;
  subtitulo: string | null;
  badge: string | null;
  cta_label: string | null;
  cta_mensaje: string | null;
  min_items: number | null;
  hasta: string | null;
  // solo en desarrollo, para ver el diseño con la tabla promos vacía
  ejemplo?: boolean;
};

export type Recomendada = {
  media: HomeMedia;
  frase: string;
  razones: string[];
  // false cuando no hay recomendación elegida por el admin y se usa la de respaldo
  elegida: boolean;
};

export type HomeData = {
  nuevos: HomeMedia[];
  nuevosSonDeLaSemana: boolean;
  recomendada: Recomendada | null;
  promosStrip: Promo[];
  promosCard: Promo[];
  whatsappUrl: string | null;
  horario: string | null;
  precios: Precio[];
};

const DIAS_NOVEDAD = 7;
const MIN_NUEVOS = 4;

export async function getHomeData(): Promise<HomeData> {
  const sb = createServerClient();
  const desdeSemana = new Date(Date.now() - DIAS_NOVEDAD * 864e5).toISOString();
  const ahora = new Date().toISOString();

  const [semana, recientes, reco, promos, info, precios] = await Promise.all([
    sb.from("media").select(MEDIA_FIELDS).gte("created_at", desdeSemana)
      .order("estreno", { ascending: false }).order("created_at", { ascending: false }).limit(24),
    sb.from("media").select(MEDIA_FIELDS).not("poster_url", "is", null)
      .order("created_at", { ascending: false }).limit(12),
    sb.from("recomendacion").select("frase, razones, media:media_id(" + MEDIA_FIELDS + ")")
      .eq("activa", true).lte("desde", ahora).or(`hasta.is.null,hasta.gt.${ahora}`).limit(1).maybeSingle(),
    sb.from("promos").select("id,kind,titulo,subtitulo,badge,cta_label,cta_mensaje,min_items,hasta")
      .eq("activa", true).lte("desde", ahora).or(`hasta.is.null,hasta.gt.${ahora}`)
      .order("prioridad", { ascending: false }),
    // "*" y no una lista: así no se rompe si todavía no se ejecutó el SQL 002 (columna horario).
    sb.from("business_info").select("*").limit(1).maybeSingle(),
    sb.from("pricing_categories").select("category,price,currency").eq("is_active", true),
  ]);

  const deLaSemana = (semana.data ?? []) as unknown as HomeMedia[];
  const nuevosSonDeLaSemana = deLaSemana.length >= MIN_NUEVOS;
  const nuevos = nuevosSonDeLaSemana ? deLaSemana : ((recientes.data ?? []) as unknown as HomeMedia[]);

  let recomendada: Recomendada | null = null;
  const r = reco.data as unknown as { frase: string; razones: string[] | null; media: HomeMedia | null } | null;
  if (r?.media) {
    recomendada = { media: r.media, frase: r.frase, razones: (r.razones ?? []).slice(0, 3), elegida: true };
  } else {
    // Respaldo: el estreno más reciente con póster.
    const fallback = nuevos.find((m) => m.estreno && m.poster_url) ?? nuevos.find((m) => m.poster_url);
    if (fallback) {
      recomendada = { media: fallback, frase: resumir(fallback.synopsis, 140), razones: [], elegida: false };
    }
  }

  let todasPromos = (promos.data ?? []) as Promo[];
  if (!todasPromos.length && process.env.NODE_ENV === "development") todasPromos = promosDeEjemplo();

  return {
    nuevos,
    nuevosSonDeLaSemana,
    recomendada,
    promosStrip: todasPromos.filter((p) => p.kind === "strip"),
    promosCard: todasPromos.filter((p) => p.kind === "card"),
    whatsappUrl: info.data?.whatsapp_url ?? null,
    horario: horarioDe(info.data),
    precios: (precios.data ?? []) as Precio[],
  };
}

export type PedidoConfig = {
  precios: Precio[];
  whatsappUrl: string | null;
  // promo activa con mínimo de títulos (barra de progreso de "Mi pedido")
  promo: { titulo: string; badge: string | null; min_items: number } | null;
};

export async function getPedidoConfig(): Promise<PedidoConfig> {
  const sb = createServerClient();
  const ahora = new Date().toISOString();
  const [precios, info, promos] = await Promise.all([
    sb.from("pricing_categories").select("category,price,currency").eq("is_active", true),
    sb.from("business_info").select("whatsapp_url").limit(1).maybeSingle(),
    sb.from("promos").select("id,kind,titulo,subtitulo,badge,cta_label,cta_mensaje,min_items,hasta")
      .eq("activa", true).not("min_items", "is", null).lte("desde", ahora).or(`hasta.is.null,hasta.gt.${ahora}`)
      .order("prioridad", { ascending: false }).limit(1),
  ]);
  let lista = (promos.data ?? []) as Promo[];
  if (!lista.length && process.env.NODE_ENV === "development") lista = promosDeEjemplo().filter((p) => p.min_items);
  const p = lista[0];
  return {
    precios: (precios.data ?? []) as Precio[],
    whatsappUrl: info.data?.whatsapp_url ?? null,
    promo: p?.min_items ? { titulo: p.titulo, badge: p.badge, min_items: p.min_items } : null,
  };
}

export type TarifaPublica = Precio & { description: string | null };

export type PreciosPagina = {
  tarifas: TarifaPublica[];
  promosCard: Promo[];
  whatsappUrl: string | null;
  horario: string | null;
  titulo: string | null;
  descripcion: string | null;
};

/** Datos de /descripcion (Precios): tarifas visibles en su orden, ofertas activas y datos del negocio. */
export async function getPreciosPagina(): Promise<PreciosPagina> {
  const sb = createServerClient();
  const ahora = new Date().toISOString();
  const [tarifas, info, promos] = await Promise.all([
    sb.from("pricing_categories").select("category,price,currency,description").eq("is_active", true).order("display_order", { ascending: true }),
    sb.from("business_info").select("*").limit(1).maybeSingle(),
    sb.from("promos").select("id,kind,titulo,subtitulo,badge,cta_label,cta_mensaje,min_items,hasta")
      .eq("activa", true).eq("kind", "card").lte("desde", ahora).or(`hasta.is.null,hasta.gt.${ahora}`)
      .order("prioridad", { ascending: false }),
  ]);
  let promosCard = (promos.data ?? []) as Promo[];
  if (!promosCard.length && process.env.NODE_ENV === "development") promosCard = promosDeEjemplo().filter((p) => p.kind === "card");
  return {
    tarifas: (tarifas.data ?? []) as TarifaPublica[],
    promosCard,
    whatsappUrl: info.data?.whatsapp_url ?? null,
    horario: horarioDe(info.data),
    titulo: info.data?.title ?? null,
    descripcion: info.data?.description ?? null,
  };
}

// Nunca se muestran en producción: los precios reales los define el admin en la tabla promos.
function promosDeEjemplo(): Promo[] {
  const en = (dias: number) => new Date(Date.now() + dias * 864e5).toISOString();
  const base = { subtitulo: null, badge: null, cta_label: null, cta_mensaje: null, min_items: null, hasta: null, ejemplo: true };
  return [
    { ...base, id: "ejemplo-strip", kind: "strip", titulo: "🔥 Paquete de esta semana: 1 TB por 500 CUP", subtitulo: "Lunes a viernes de 9am a 6pm", badge: "Nuevo", cta_label: "Reservar turno" },
    { ...base, id: "ejemplo-1", kind: "card", badge: "-20%", titulo: "5 películas por 200 CUP", subtitulo: "Para clientes fijos del paquete semanal", cta_label: "Lo quiero", min_items: 5, hasta: en(3.6) },
    { ...base, id: "ejemplo-2", kind: "card", badge: "Combo", titulo: "Paquete + 1 temporada: 580 CUP", subtitulo: "Elige cualquier serie o anime del catálogo", cta_label: "Armar combo", hasta: en(5.2) },
    { ...base, id: "ejemplo-3", kind: "card", badge: "A pedido", titulo: "¿No está en el catálogo? Te lo buscamos", subtitulo: "Dinos el nombre y te confirmamos si se puede conseguir", cta_label: "Pedir título" },
  ];
}

function resumir(texto: string | null | undefined, max: number): string {
  const t = (texto ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(" ", max)).replace(/[,.;:]$/, "") + "…";
}

/**
 * El horario se edita en Negocio (columna `horario`). Si la columna no existe todavía (SQL 002 sin
 * ejecutar), se saca de la descripción: "HORARIO …: Lunes a Viernes de 9am a 6pm." → "Lunes a Viernes de 9am a 6pm".
 */
function horarioDe(info: { horario?: string | null; description?: string | null } | null): string | null {
  if (!info) return null;
  if ("horario" in info) return info.horario?.trim() || null;
  const m = info.description?.match(/HORARIO[^:]*:\s*([^\r\n.]+)/i);
  return m ? m[1].trim() : null;
}
