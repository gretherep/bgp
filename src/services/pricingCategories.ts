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
