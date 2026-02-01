import { createServerClient } from "../utils/supabaseServer";

const supabase = createServerClient();

export async function getActivePricingCategories() {
    const { data, error } = await supabase
        .from("pricing_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

    if (error) throw error;
    return data;
}

export async function getAllPricingCategories() {
    const { data, error } = await supabase
        .from("pricing_categories")
        .select("*")
        .order("display_order");

    if (error) throw error;
    return data;
}

export async function getPricingCategoryById(id: string) {
    const { data, error } = await supabase
        .from("pricing_categories")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data;
}

export async function createPricingCategory(data: any) {
    const { error } = await supabase.from("pricing_categories").insert(data);
    if (error) throw error;
}

export async function updatePricingCategory(id: string, data: any) {
    const { error } = await supabase
        .from("pricing_categories")
        .update(data)
        .eq("id", id);
    if (error) throw error;
}

export async function deletePricingCategory(id: string) {
    const { error } = await supabase
        .from("pricing_categories")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

export async function reorderPricingCategories(updated: { id: string; display_order: number }[]) {
    const { error } = await supabase.from("pricing_categories").upsert(updated, { onConflict: "id" });
    if (error) throw error;
}
