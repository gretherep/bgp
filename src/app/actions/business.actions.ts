"use server";

import { createServerClient } from "@/utils/supabaseServer";

// Tipo opcional (para autocompletado)
export interface BusinessInfo {
  id: string;
  title: string;
  image_url: string | null;
  description: string | null;
  price_basic: number | null;
  price_standard: number | null;
  price_premium: number | null;
  whatsapp_url: string | null;
  telegram_url: string | null;
  updated_at: string;
}

// Obtener la información del negocio (solo 1 fila)
export async function getBusinessInfo(): Promise<BusinessInfo | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("business_info")
    .select("*")
    .single();

  if (error) {
    console.error("Error al cargar business_info:", error.message);
    return null;
  }

  return data as BusinessInfo;
}

// Actualizar la información del negocio (solo admin)
export async function updateBusinessInfo(info: Partial<BusinessInfo>) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("business_info")
    .update({
      title: info.title,
      image_url: info.image_url ?? null,
      description: info.description ?? null,
      price_basic: info.price_basic ?? null,
      price_standard: info.price_standard ?? null,
      price_premium: info.price_premium ?? null,
      whatsapp_url: info.whatsapp_url ?? null,
      telegram_url: info.telegram_url ?? null,
    })
    .eq("id", info.id);

  if (error) {
    console.error("Error al actualizar business_info:", error.message);
    throw new Error(error.message);
  }

  return { success: true };
}
