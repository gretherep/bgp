"use server";

import * as PricingCategoryService from "@/services/pricingCategories";
import { PricingCategory } from "@/app/models/pricingCategory";

// La edición de precios vive en app/admin/pricing-categories/actions.ts.
export async function getActivePricingCategories(): Promise<PricingCategory[]> {
  try {
    const data = await PricingCategoryService.getActivePricingCategories();
    return data as PricingCategory[];
  } catch (error) {
    console.error("Error al cargar pricing_categories:", error instanceof Error ? error.message : error);
    return [];
  }
}
