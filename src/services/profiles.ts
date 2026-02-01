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

export async function getAllProfiles() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*");

    if (error) throw error;
    return data;
}

export async function updateProfile(id: string, updates: { name?: string; role?: string; first_name?: string; last_name?: string }) {
    const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProfile(id: string) {
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);
    if (profileError) throw profileError;
}

export async function updateUserPassword(id: string, password: string) {
    const { error } = await supabase.auth.admin.updateUserById(id, {
        password: password,
    });
    if (error) throw error;
}
