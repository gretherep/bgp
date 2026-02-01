import { createServerClient } from "../utils/supabaseServer";

const supabase = createServerClient();

export async function getRatingsByMediaId(mediaId: string) {
    const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("media_id", mediaId);

    if (error) throw error;
    return data;
}

export async function upsertRating(ratingData: { user_id: string; media_id: string; rating: number }) {
    const { data, error } = await supabase
        .from("ratings")
        .upsert([ratingData], { onConflict: "user_id,media_id" })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getAverageRating(mediaId: string) {
    const { data, error } = await supabase
        .from("ratings")
        .select("rating")
        .eq("media_id", mediaId);

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / data.length;
}
