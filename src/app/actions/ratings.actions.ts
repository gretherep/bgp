"use server";

import { createServerClient } from "@/utils/supabaseServer";

export async function getMediaAverageRating(mediaId: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("media_id", mediaId);

  if (error) {
    console.error(error);
    throw new Error("No se pudo obtener el rating");
  }

  if (!data || data.length === 0) return 0;

  const total = data.reduce((acc, r) => acc + r.rating, 0);
  const average = total / data.length;

  return Number(average.toFixed(1)); // ✅ 1 decimal (4.3)
}
