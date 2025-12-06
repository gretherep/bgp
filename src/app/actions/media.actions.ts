"use server";

import { createServerClient } from "@/utils/supabaseServer";
import { Media } from "../models/media";

/**
 * Obtener todos los media (accesible para cualquier usuario)
 */
export async function getAllMedia(): Promise<(Media & { avg_rating: number })[]> {
  const supabase = await createServerClient(); // ✅ await

  const { data: mediaData, error: mediaError } = await supabase
    .from("media")
    .select("*");

  if (mediaError) throw new Error(mediaError.message);
  const media = mediaData ?? [];

  const mediaWithRatings = await Promise.all(
    media.map(async (m) => {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("ratings")
        .select("rating")
        .eq("media_id", m.id);

      if (ratingsError) throw new Error(ratingsError.message);

      const ratings = ratingsData ?? [];
      const avg_rating =
        ratings.length > 0
          ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
          : 0;

      return {
        ...m,
        avg_rating,
      };
    })
  );

  return mediaWithRatings;
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
