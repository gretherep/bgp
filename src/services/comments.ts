import { createServerClient } from "../utils/supabaseServer";

const supabase = createServerClient();

export async function getCommentsByMediaId(mediaId: string) {
    const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("media_id", mediaId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
}

export async function createComment(commentData: { user_id: string; media_id: string; comment: string }) {
    const { data, error } = await supabase
        .from("comments")
        .insert([commentData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteComment(id: string) {
    const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", id);

    if (error) throw error;
}
