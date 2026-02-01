"use server";

import * as PricingCategoryService from "@/services/pricingCategories";
import { PricingCategory } from "@/app/models/pricingCategory";
import { requireAdminAction } from "@/utils/auth";

/**
 * Funciones públicas
 */
export async function getActivePricingCategories(): Promise<PricingCategory[]> {
  try {
    const data = await PricingCategoryService.getActivePricingCategories();
    return data as PricingCategory[];
  } catch (error: any) {
    console.error("Error al cargar pricing_categories:", error.message);
    return [];
  }
}

/**
 * Funciones admin
 */
export async function getAllPricingCategories(): Promise<PricingCategory[]> {
  await requireAdminAction();
  const data = await PricingCategoryService.getAllPricingCategories();
  return data as PricingCategory[];
}

export async function getPricingCategoryById(id: string): Promise<PricingCategory | null> {
  await requireAdminAction();
  const data = await PricingCategoryService.getPricingCategoryById(id);
  return data as PricingCategory;
}

export async function createPricingCategory(data: Omit<PricingCategory, "id" | "created_at" | "updated_at">) {
  await requireAdminAction();
  await PricingCategoryService.createPricingCategory(data);
}

export async function updatePricingCategory(id: string, data: Partial<PricingCategory>) {
  await requireAdminAction();
  await PricingCategoryService.updatePricingCategory(id, data);
}

export async function deletePricingCategory(id: string) {
  await requireAdminAction();
  await PricingCategoryService.deletePricingCategory(id);
}

export async function reorderPricingCategories(updated: { id: string; display_order: number }[]) {
  await requireAdminAction();
  await PricingCategoryService.reorderPricingCategories(updated);
  return { success: true };
}
