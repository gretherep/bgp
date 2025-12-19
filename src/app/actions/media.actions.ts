"use server";

import { createServerClient } from "@/utils/supabaseServer";
import { Media } from "../models/media";

/**
 * Obtener todos los media (accesible para cualquier usuario)
 */
export async function getAllMedia(): Promise<(Media & { avg_rating: number })[]> {
  try {
    const supabase = await createServerClient();

    // ✅ Consulta única optimizada: trae media y sus ratings de golpe
    const { data: mediaData, error: mediaError } = await supabase
      .from("media")
      .select(`
        *,
        ratings (
          rating
        )
      `);

    if (mediaError) {
      console.error("Supabase Error:", mediaError.message);
      throw new Error(mediaError.message);
    }

    if (!mediaData) return [];

    // ✅ Procesamos los datos en memoria (mucho más rápido que hacer 50 consultas)
    const mediaWithRatings = mediaData.map((m: any) => {
      const ratings = m.ratings || [];
      const avg_rating =
        ratings.length > 0
          ? ratings.reduce((acc: number, r: any) => acc + r.rating, 0) / ratings.length
          : 0;

      // Eliminamos la propiedad ratings para no enviar datos extra innecesarios al cliente
      const { ratings: _, ...mediaContent } = m;
      
      return {
        ...mediaContent,
        avg_rating,
      };
    });

    return mediaWithRatings;
  } catch (error) {
    console.error("Critical error in getAllMedia:", error);
    return []; // Retornamos array vacío para evitar que la página explote
  }
}

/**
 * Obtener un media por ID (accesible para cualquier usuario)
 */
export async function getMediaById(id: string): Promise<Media | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// utils para generar slugs
function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD")                // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");           // espacios -> guiones
}

/**
 * Crear un nuevo media (solo admin)
 */
export async function createMedia(formData: FormData, userId: string) {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  const category = String(formData.get("category") ?? "");
  const slug = slugify(category);

  const { error } = await supabase.from("media").insert({
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    poster_url: formData.get("poster_url") ? String(formData.get("poster_url")) : null,
    genre: String(formData.get("genre") ?? ""),
    year: Number(formData.get("year") ?? 0),
    category,
    slug,
  });

  if (error) throw new Error(error.message);
}

/**
 * Actualizar un media existente (solo admin)
 */
export async function updateMedia(id: string, formData: FormData, userId: string): Promise<void> {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  const { error } = await supabase
    .from("media")
    .update({
      title: String(formData.get("title") ?? ""),
      synopsis: String(formData.get("synopsis") ?? ""),
      poster_url: formData.get("poster_url") ? String(formData.get("poster_url")) : null,
      genre: String(formData.get("genre") ?? ""),
      year: Number(formData.get("year") ?? 0),
      category: String(formData.get("category") ?? ""),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Eliminar un media (solo admin)
 */
export async function deleteMedia(id: string, userId: string): Promise<void> {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  const { error } = await supabase.from("media").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Crear rating (usuario autenticado)
 */
export async function createRating(mediaId: string, rating: number, userId: string) {
  if (!userId) throw new Error("Usuario no autenticado");

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("ratings")
    .insert({
      media_id: mediaId,
      rating,
      user_id: userId,
    });

  if (error) throw new Error(error.message);

  return { success: true };
}
