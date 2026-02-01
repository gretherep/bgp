"use server";

import * as MediaService from "@/services/media";
import * as RatingsService from "@/services/ratings";
import { Media } from "../models/media";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/utils/auth";


/**
 * Obtener todos los media (accesible para cualquier usuario)
 */
export async function getAllMedia(): Promise<(Media & { avg_rating: number })[]> {
  try {
    // MediaService.getAllMedia now handles average ratings internally in an optimized way
    const mediaWithRatings = await MediaService.getAllMedia();
    return mediaWithRatings as (Media & { avg_rating: number })[];
  } catch (error) {
    console.error("Critical error in getAllMedia:", error);
    return [];
  }
}

/**
 * Obtener un media por ID (accesible para cualquier usuario)
 */
export async function getMediaById(id: string): Promise<Media | null> {
  try {
    return await MediaService.getMediaById(id);
  } catch (error) {
    return null;
  }
}

// utils para generar slugs
function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Crear un nuevo media (solo admin)
 */
export async function createMedia(formData: FormData) {
  await requireAdminAction();
  const category = String(formData.get("category") ?? "");
  const slug = slugify(category);

  const mediaData = {
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    poster_url: formData.get("poster_url") ? String(formData.get("poster_url")) : null,
    genre: String(formData.get("genre") ?? ""),
    year: Number(formData.get("year") ?? 0),
    category,
    slug,
  };

  await MediaService.createMedia(mediaData);
  revalidatePath("/admin/media");
}

/**
 * Actualizar un media existente (solo admin)
 */
export async function updateMedia(id: string, formData: FormData): Promise<void> {
  await requireAdminAction();
  const updates = {
    title: String(formData.get("title") ?? ""),
    synopsis: String(formData.get("synopsis") ?? ""),
    poster_url: formData.get("poster_url") ? String(formData.get("poster_url")) : null,
    genre: String(formData.get("genre") ?? ""),
    year: Number(formData.get("year") ?? 0),
    category: String(formData.get("category") ?? ""),
  };

  await MediaService.updateMedia(id, updates);
  revalidatePath("/admin/media");
}

/**
 * Eliminar un media (solo admin)
 */
export async function deleteMedia(id: string): Promise<void> {
  await requireAdminAction();
  await MediaService.deleteMedia(id);
  revalidatePath("/admin/media");
}

/**
 * Crear rating (usuario autenticado)
 */
export async function createRating(mediaId: string, rating: number, userId: string) {
  if (!userId) throw new Error("Usuario no autenticado");
  await RatingsService.upsertRating({ media_id: mediaId, rating, user_id: userId });
  return { success: true };
}
