import "server-only";
import { createServerClient } from "@/utils/supabaseServer";
import { CATEGORIAS, GENEROS, PAGE_SIZE, aniosFiltro, type FiltrosCatalogo } from "./categories";
import type { HomeMedia } from "./catalog";

// Mismos campos que el Inicio: tarjeta + modal de detalle.
export const CARD_FIELDS =
  "id,slug,title,synopsis,poster_url,genre,year,category,estreno,idioma,seasons,created_at,updated_at,rating_avg,rating_count";

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

/** Top por calificación real: promedio y, a igualdad, cantidad de votos. */
export async function getTopValorados(limite = 10): Promise<HomeMedia[]> {
  const sb = createServerClient();
  const { data, error } = await sb
    .from("media")
    .select(CARD_FIELDS)
    .gt("rating_count", 0)
    .not("poster_url", "is", null)
    .order("rating_avg", { ascending: false })
    .order("rating_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []) as unknown as HomeMedia[];
}
