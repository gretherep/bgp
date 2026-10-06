"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/utils/auth";
import { createServerClient } from "@/utils/supabaseServer";
import { MEDIA_CATEGORIES } from "@/app/models/media-categories";

export type Resultado<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const POSTERS = "posters";
const MAX_POSTER_BYTES = 900 * 1024; // las Server Actions aceptan ~1 MB por petición
const CON_TEMPORADAS = ["Series", "MiniSeries", "Series Animadas", "Anime", "Novelas", "Reality Shows"];

async function protegido<T>(fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    await requireAdminAction();
  } catch {
    return { ok: false, error: "Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión." };
  }
  try {
    return await fn();
  } catch (e) {
    console.error("[admin/media]", e);
    return { ok: false, error: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
  }
}

function refrescar() {
  revalidatePath("/");
  revalidatePath("/category/[category]", "page");
  revalidatePath("/titulo/[slug]", "page");
  revalidatePath("/admin/media");
  revalidatePath("/admin/dashboard");
}

const texto = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

export type TituloInput = {
  id?: string;
  title: string;
  synopsis: string;
  poster_url: string;
  genre: string;
  year: number;
  category: string;
  idioma: string;
  seasons: number | null;
  estreno: boolean;
  /**
   * Versiones livianas del póster (docs/sql/005). undefined: no se tocan (el póster no cambió);
   * null: se borran (póster nuevo sin versiones: el sitio usa el original hasta que corra el script).
   */
  variantes?: { thumb: string; md: string; full: string; color: string } | null;
};

const URL_HTTPS = /^https:\/\/\S+$/;
const COLOR = /^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/;

export async function guardarTitulo(input: TituloInput): Promise<Resultado<{ id: string }>> {
  return protegido(async () => {
    const anioMax = new Date().getFullYear() + 1;
    const fila = {
      title: texto(input.title),
      synopsis: (typeof input.synopsis === "string" ? input.synopsis : "").trim(),
      poster_url: texto(input.poster_url) || null,
      genre: texto(input.genre),
      year: Math.floor(Number(input.year)),
      category: input.category,
      idioma: texto(input.idioma) || null,
      seasons: CON_TEMPORADAS.includes(input.category) && input.seasons && input.seasons > 0 ? Math.floor(input.seasons) : null,
      estreno: !!input.estreno,
    };

    if (fila.title.length < 1) return { ok: false, error: "El título es obligatorio." };
    if (fila.title.length > 200) return { ok: false, error: "El título es demasiado largo (máx. 200)." };
    if (!MEDIA_CATEGORIES.includes(fila.category as (typeof MEDIA_CATEGORIES)[number])) return { ok: false, error: "Elige una categoría." };
    if (!Number.isFinite(fila.year) || fila.year < 1900 || fila.year > anioMax) return { ok: false, error: `El año debe estar entre 1900 y ${anioMax}.` };
    if (!fila.genre) return { ok: false, error: "Escribe al menos un género." };
    if (fila.synopsis.length < 10) return { ok: false, error: "Escribe una sinopsis (mínimo 10 caracteres)." };
    if (fila.poster_url && !/^https:\/\//.test(fila.poster_url)) return { ok: false, error: "La URL del póster debe empezar con https://" };

    const v = input.variantes;
    if (v && (![v.thumb, v.md, v.full].every((u) => URL_HTTPS.test(u)) || !COLOR.test(v.color))) return { ok: false, error: "Las versiones del póster no son válidas." };
    const variantes =
      v === undefined
        ? {}
        : v === null
          ? { poster_thumb_url: null, poster_md_url: null, poster_full_url: null, poster_color: null }
          : { poster_thumb_url: v.thumb, poster_md_url: v.md, poster_full_url: v.full, poster_color: v.color };

    const sb = createServerClient();
    if (input.id) {
      const { error } = await sb.from("media").update({ ...fila, ...variantes }).eq("id", input.id);
      if (error) throw error;
      refrescar();
      return { ok: true, data: { id: input.id } };
    }
    const { data, error } = await sb.from("media").insert({ ...fila, ...variantes }).select("id").single();
    if (error) throw error;
    refrescar();
    return { ok: true, data: { id: data.id as string } };
  });
}

/** Recibe el póster ya comprimido en el navegador (WebP) y devuelve su URL pública. */
export async function subirPoster(formData: FormData): Promise<Resultado<{ url: string }>> {
  return protegido(async () => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No llegó ninguna imagen." };
    if (!file.type.startsWith("image/")) return { ok: false, error: "El archivo no es una imagen." };
    if (file.size > MAX_POSTER_BYTES) return { ok: false, error: "La imagen pesa demasiado incluso comprimida. Prueba con otra más pequeña." };

    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    // Nombre único: la URL nunca cambia de contenido, así puede cachearse un año.
    const nombre = `${crypto.randomUUID()}.${ext}`;
    const sb = createServerClient();
    const { error } = await sb.storage.from(POSTERS).upload(nombre, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
    if (error) throw error;
    const { data } = sb.storage.from(POSTERS).getPublicUrl(nombre);
    return { ok: true, data: { url: data.publicUrl } };
  });
}

export async function cambiarEstreno(id: string, estreno: boolean): Promise<Resultado> {
  return protegido(async () => {
    const { error } = await createServerClient().from("media").update({ estreno }).eq("id", id);
    if (error) throw error;
    refrescar();
    return { ok: true };
  });
}

export async function borrarTitulo(id: string): Promise<Resultado> {
  return protegido(async () => {
    // Votos y recomendaciones del título se borran en cascada (FK on delete cascade).
    const { error } = await createServerClient().from("media").delete().eq("id", id);
    if (error) throw error;
    refrescar();
    return { ok: true };
  });
}

/** Quita espacios al inicio/final (y dobles) de todos los títulos que los tengan. */
export async function corregirEspaciosEnTitulos(): Promise<Resultado<{ corregidos: number }>> {
  return protegido(async () => {
    const sb = createServerClient();
    // Tres consultas simples (empieza, termina o tiene doble espacio) en vez de un or() con espacios en el valor.
    const consultas = await Promise.all([" %", "% ", "%  %"].map((p) => sb.from("media").select("id, title").like("title", p).limit(1000)));
    const conError = consultas.find((c) => c.error);
    if (conError?.error) throw conError.error;
    const unicos = new Map<string, string>();
    consultas.forEach((c) => (c.data ?? []).forEach((m) => unicos.set(m.id as string, m.title as string)));
    const cambios = [...unicos].map(([id, title]) => ({ id, antes: title, title: texto(title) })).filter((m) => m.title && m.title !== m.antes);
    // En tandas de 10: 100+ updates simultáneos hacen fallar algunos por la red.
    let corregidos = 0;
    for (let i = 0; i < cambios.length; i += 10) {
      const res = await Promise.all(cambios.slice(i, i + 10).map((m) => sb.from("media").update({ title: m.title }).eq("id", m.id)));
      corregidos += res.filter((r) => !r.error).length;
    }
    refrescar();
    if (corregidos < cambios.length) {
      return { ok: false, error: `Se corrigieron ${corregidos} de ${cambios.length}. Toca "Corregir ahora" otra vez para el resto.` };
    }
    return { ok: true, data: { corregidos } };
  });
}
