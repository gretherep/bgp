import { createServerClient } from "../utils/supabaseServer";

const supabase = createServerClient();

export async function getAllMedia(options: { search?: string; offset?: number; limit?: number; category?: string } = {}) {
    let query = supabase.from("media").select("*, ratings(rating)");

    if (options.search) {
        query = query.ilike("title", `%${options.search}%`);
    }

    if (options.category) {
        const cat = options.category.toLowerCase();
        if (cat === "animados") {
            query = query.ilike("category", "Películas Animadas");
        } else if (cat === "peliculas") {
            query = query.ilike("category", "Películas").not("category", "ilike", "%Animadas%");
        } else if (cat === "reality") {
            query = query.ilike("category", "Reality Shows");
        } else if (cat === "series") {
            query = query.ilike("category", "Series");
        } else if (cat === "novelas") {
            query = query.ilike("category", "Novelas");
        } else if (cat === "anime") {
            query = query.ilike("category", "Anime");
        } else {
            query = query.ilike("category", options.category);
        }
    }

    // Estreno first (desc puts true before false), then Year (newest first)
    query = query.order("estreno", { ascending: false }).order("year", { ascending: false });

    if (options.offset !== undefined && options.limit !== undefined && options.limit > 0) {
        query = query.range(options.offset, options.offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Process ratings to calculate average
    return (data || []).map((m: any) => {
        const ratings = m.ratings || [];
        const avg_rating = ratings.length > 0
            ? ratings.reduce((acc: number, r: any) => acc + r.rating, 0) / ratings.length
            : 0;

        const { ratings: _, ...mediaContent } = m;
        return {
            ...mediaContent,
            avg_rating
        };
    });
}

export async function countMedia(options: { search?: string; category?: string } = {}) {
    let query = supabase.from("media").select("*", { count: "exact", head: true });

    if (options.search) {
        query = query.ilike("title", `%${options.search}%`);
    }

    if (options.category) {
        const cat = options.category.toLowerCase();
        if (cat === "animados") {
            query = query.ilike("category", "Películas Animadas");
        } else if (cat === "peliculas") {
            query = query.ilike("category", "Películas").not("category", "ilike", "%Animadas%");
        } else if (cat === "reality") {
            query = query.ilike("category", "Reality Shows");
        } else if (cat === "series") {
            query = query.ilike("category", "Series");
        } else if (cat === "novelas") {
            query = query.ilike("category", "Novelas");
        } else if (cat === "anime") {
            query = query.ilike("category", "Anime");
        } else {
            query = query.ilike("category", options.category);
        }
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
}

export async function getMediaById(id: string) {
    const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data;
}

export async function searchMedia(query: string) {
    const { data, error } = await supabase
        .from("media")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (error) throw error;
    return data;
}

export async function createMedia(mediaData: any) {
    const { data, error } = await supabase
        .from("media")
        .insert([mediaData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateMedia(id: string, updates: any) {
    const { data, error } = await supabase
        .from("media")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteMedia(id: string) {
    const { error } = await supabase
        .from("media")
        .delete()
        .eq("id", id);

    if (error) throw error;
}
