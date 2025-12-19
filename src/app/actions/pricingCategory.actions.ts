"use server";

import { createServerClient } from "@/utils/supabaseServer";
import { PricingCategory } from "@/app/models/pricingCategory";

/**
 * Funciones públicas
 */
export async function getActivePricingCategories(): Promise<PricingCategory[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pricing_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error al cargar pricing_categories:", error.message);
    return [];
  }

  return data as PricingCategory[];
}

/**
 * Funciones admin
 */
export async function getAllPricingCategories(): Promise<PricingCategory[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pricing_categories")
    .select("*")
    .order("display_order");

  if (error) throw new Error(error.message);
  return data as PricingCategory[];
}

export async function getPricingCategoryById(id: string): Promise<PricingCategory | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("pricing_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createPricingCategory(data: Omit<PricingCategory, "id" | "created_at" | "updated_at">) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("pricing_categories").insert(data);
  if (error) throw new Error(error.message);
}

export async function updatePricingCategory(id: string, data: Partial<PricingCategory>) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("pricing_categories")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePricingCategory(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("pricing_categories")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function reorderPricingCategories(updated: { id: string; display_order: number }[]) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("pricing_categories").upsert(updated, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { success: true };
}
