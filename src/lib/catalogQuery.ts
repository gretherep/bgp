import "server-only";
import { createServerClient } from "@/utils/supabaseServer";
import { CATEGORIAS, GENEROS, PAGE_SIZE, aniosFiltro, type FiltrosCatalogo } from "./categories";
import type { HomeMedia } from "./catalog";

// Mismos campos que el Inicio: tarjeta + modal de detalle.
export const CARD_FIELDS =
  "id,slug,title,synopsis,poster_url,poster_thumb_url,poster_md_url,poster_full_url,poster_color,genre,year,category,estreno,idioma,seasons,created_at,updated_at,rating_avg,rating_count";

export type PaginaCatalogo = { items: HomeMedia[]; total: number; page: number; pageSize: number };

/**
 * Página del catálogo con filtros. Siempre paginada con range(): nunca trae la tabla entera
 * (y evita el tope silencioso de 1000 filas de Supabase).
 */
export async function getCatalogo(f: FiltrosCatalogo, page = 1, soloTotal = false): Promise<PaginaCatalogo> {
  const sb = createServerClient();
  let q = sb.from("media").select(soloTotal ? "id" : CARD_FIELDS, { count: "exact", head: soloTotal });

  const cat = CATEGORIAS.find((c) => c.slug === f.cat);
  if (cat) q = q.in("category", cat.categorias);

  const anio = aniosFiltro().find((a) => a.slug === f.anio);
  if (anio?.min !== undefined) q = q.gte("year", anio.min);
  if (anio?.max !== undefined) q = q.lte("year", anio.max);

  const patrones = f.generos.flatMap((g) => GENEROS.find((x) => x.slug === g)?.patrones ?? []);
  if (patrones.length) q = q.or(patrones.map((p) => `genre.ilike.%${p}%`).join(","));

  switch (f.orden) {
    case "recientes":
      q = q.order("created_at", { ascending: false });
      break;
    case "valorados":
      q = q.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
      break;
    case "az":
      q = q.order("title", { ascending: true });
      break;
    default:
      // Estrenos primero, luego los más nuevos por año y por fecha de carga.
      q = q.order("estreno", { ascending: false, nullsFirst: false })
        .order("year", { ascending: false })
        .order("created_at", { ascending: false });
  }
  // Desempate estable para que la paginación no repita ni salte títulos.
  q = q.order("id", { ascending: true });

  if (!soloTotal) {
    const desde = (Math.max(page, 1) - 1) * PAGE_SIZE;
    q = q.range(desde, desde + PAGE_SIZE - 1);
  }

  const { data, count, error } = await q;
  if (error) throw error;
  return { items: soloTotal ? [] : ((data ?? []) as unknown as HomeMedia[]), total: count ?? 0, page, pageSize: PAGE_SIZE };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Título por slug, o por id (enlaces hechos antes de que existieran los slugs). */
export async function getTituloPorRuta(ruta: string): Promise<HomeMedia | null> {
  const valor = decodeURIComponent(ruta).trim();
  if (!valor || valor.length > 120) return null;
  const { data, error } = await createServerClient()
    .from("media")
    .select(CARD_FIELDS)
    .eq(UUID.test(valor) ? "id" : "slug", valor)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as HomeMedia | null) ?? null;
}

/** "Más como este": misma categoría y, si se puede, el mismo grupo de género. Nunca incluye el propio título. */
export async function getParecidos(m: HomeMedia, limite = 12): Promise<HomeMedia[]> {
  const cat = CATEGORIAS.find((c) => c.categorias.includes(m.category));
  if (!cat) return [];
  const genero = GENEROS.find((g) => g.patrones.some((p) => (m.genre ?? "").toLowerCase().includes(p)));
  const base = { cat: cat.slug, anio: null, orden: "estrenos" as const };
  const conGenero = genero ? (await getCatalogo({ ...base, generos: [genero.slug] }, 1)).items : [];
  let lista = conGenero.filter((x) => x.id !== m.id && x.poster_url);
  if (lista.length < 6) {
    const mas = (await getCatalogo({ ...base, generos: [] }, 1)).items;
    lista = [...lista, ...mas.filter((x) => x.id !== m.id && x.poster_url && !lista.some((y) => y.id === x.id))];
  }
  return lista.slice(0, limite);
}

export const MAX_RESULTADOS = 48;

/** "Acción" → "accion" (para comparar sin tildes). */
const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Búsqueda por título. Usa la función `buscar_media` (docs/sql/003_busqueda.sql: sin tildes y
 * tolerante a errores de tipeo). Si todavía no existe, busca con ilike cambiando cada vocal por
 * "_" (un carácter cualquiera), así "accion" también encuentra "Acción".
 */
export async function buscarCatalogo(texto: string): Promise<HomeMedia[]> {
  // % y _ son comodines en LIKE; las comas y paréntesis rompen el filtro de PostgREST.
  const q = texto.replace(/[%_,()*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (q.length < 2) return [];
  const sb = createServerClient();

  const rpc = await sb.rpc("buscar_media", { q, lim: MAX_RESULTADOS });
  if (!rpc.error) return (rpc.data ?? []) as unknown as HomeMedia[];
  // PGRST202 / 42883: la función no existe todavía (SQL 003 sin ejecutar).
  if (rpc.error.code !== "PGRST202" && rpc.error.code !== "42883") throw rpc.error;

  const patron = sinTildes(q).toLowerCase().replace(/[aeiou]/g, "_");
  const { data, error } = await sb
    .from("media")
    .select(CARD_FIELDS)
    .ilike("title", `%${patron}%`)
    .order("estreno", { ascending: false, nullsFirst: false })
    .order("year", { ascending: false })
    .order("id", { ascending: true })
    .limit(MAX_RESULTADOS);
  if (error) throw error;
  return (data ?? []) as unknown as HomeMedia[];
}

/** Top por calificación real: promedio y, a igualdad, cantidad de votos. `categorias` limita a esos valores de media.category. */
export async function getTopValorados(limite = 10, categorias?: string[]): Promise<HomeMedia[]> {
  const sb = createServerClient();
  let q = sb.from("media").select(CARD_FIELDS).gt("rating_count", 0).not("poster_url", "is", null);
  if (categorias?.length) q = q.in("category", categorias);
  const { data, error } = await q
    .order("rating_avg", { ascending: false })
    .order("rating_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []) as unknown as HomeMedia[];
}
