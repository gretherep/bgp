"use server";

import { createServerClient } from "@/utils/supabaseServer";
import { BusinessInfo } from "../models/businessInfo";
import { requireAdminAction } from "@/utils/auth";


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

export async function updateBusinessInfo(formData: FormData) {
  await requireAdminAction();
  const supabase = await createServerClient();

  const id = formData.get("id") as string;
  if (!id) throw new Error("ID requerido");

  // 1️⃣ Procesar imagen
  let imageUrl: string | null = formData.get("current_image") as string | null;

  const file = formData.get("image") as File | null;

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop();
    const fileName = `logo-${id}-${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from("logo")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

    if (uploadError) {
      console.error(uploadError);
      throw new Error("Error subiendo imagen");
    }

    const { data: publicUrl } = supabase.storage
      .from("logo")
      .getPublicUrl(uploadData.path);

    imageUrl = publicUrl.publicUrl;
  }

  // 2️⃣ Actualizar BD (SOLO STRINGS)
  const { error } = await supabase
    .from("business_info")
    .update({
      title: formData.get("title"),
      description: formData.get("description"),
      image_url: imageUrl,
      whatsapp_url: formData.get("whatsapp_url"),
      telegram_url: formData.get("telegram_url"),
      price_basic: formData.get("price_basic")
        ? Number(formData.get("price_basic"))
        : null,
      price_standard: formData.get("price_standard")
        ? Number(formData.get("price_standard"))
        : null,
      price_premium: formData.get("price_premium")
        ? Number(formData.get("price_premium"))
        : null,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  return { success: true };
}
