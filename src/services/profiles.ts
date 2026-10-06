import { createServerClient } from "../utils/supabaseServer";

const supabase = createServerClient();

export async function getProfileById(userId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) throw error;
    return data;
}
