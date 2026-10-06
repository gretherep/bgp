"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/utils/auth";
import { createServerClient } from "@/utils/supabaseServer";
import { TARIFAS } from "@/lib/precios";

export type Resultado<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const MAX_DETALLE = 600;
const MONEDAS = ["CUP", "USD", "MLC"];

async function protegido<T>(fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    await requireAdminAction();
  } catch {
    return { ok: false, error: "Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión." };
  }
  try {
    return await fn();
  } catch (e) {
    console.error("[admin/precios]", e);
    return { ok: false, error: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
  }
}

// Los precios salen en el Inicio (tarjetas, Mi pedido), en Portada (vista previa) y en /descripcion.
function refrescar() {
  revalidatePath("/");
  revalidatePath("/category/[category]", "page");
  revalidatePath("/titulo/[slug]", "page");
  revalidatePath("/descripcion");
  revalidatePath("/admin/pricing-categories");
  revalidatePath("/admin/portada");
}

export type PrecioInput = { id?: string; category: string; price: number; currency: string; description: string; is_active: boolean };

export async function guardarPrecio(input: PrecioInput): Promise<Resultado<{ id: string }>> {
  return protegido(async () => {
    const precio = Math.round(Number(input.price) * 100) / 100;
    const fila = {
      price: precio,
      currency: MONEDAS.includes(input.currency) ? input.currency : "CUP",
      description: (typeof input.description === "string" ? input.description : "").trim() || null,
      is_active: !!input.is_active,
    };
    if (!Number.isFinite(precio) || precio <= 0) return { ok: false, error: "El precio debe ser mayor que 0." };
    if (precio > 100000) return { ok: false, error: "El precio es demasiado alto." };
    if ((fila.description ?? "").length > MAX_DETALLE) return { ok: false, error: `El detalle es demasiado largo (máx. ${MAX_DETALLE}).` };

    const sb = createServerClient();
    if (input.id) {
      const { error } = await sb.from("pricing_categories").update(fila).eq("id", input.id);
      if (error) throw error;
      refrescar();
      return { ok: true, data: { id: input.id } };
    }

    // Alta: solo tarifas conocidas y que todavía no existan.
    if (!TARIFAS.some((t) => t.nombre === input.category)) return { ok: false, error: "Elige una tarifa." };
    const { count } = await sb.from("pricing_categories").select("id", { count: "exact", head: true }).eq("category", input.category);
    if (count) return { ok: false, error: `Ya existe la tarifa de ${input.category}.` };
    const { data: ultima } = await sb.from("pricing_categories").select("display_order").order("display_order", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await sb
      .from("pricing_categories")
      .insert({ ...fila, category: input.category, display_order: (ultima?.display_order ?? -1) + 1 })
      .select("id")
      .single();
    if (error) throw error;
    refrescar();
    return { ok: true, data: { id: data.id as string } };
  });
}

export async function cambiarActivoPrecio(id: string, activo: boolean): Promise<Resultado> {
  return protegido(async () => {
    const { error } = await createServerClient().from("pricing_categories").update({ is_active: activo }).eq("id", id);
    if (error) throw error;
    refrescar();
    return { ok: true };
  });
}

/** Recibe los ids en el orden nuevo (el primero se muestra primero). */
export async function reordenarPrecios(ids: string[]): Promise<Resultado> {
  return protegido(async () => {
    if (!Array.isArray(ids) || ids.length > 50) return { ok: false, error: "Orden no válido." };
    const sb = createServerClient();
    const res = await Promise.all(ids.map((id, i) => sb.from("pricing_categories").update({ display_order: i }).eq("id", id)));
    const fallo = res.find((r) => r.error);
    if (fallo?.error) throw fallo.error;
    refrescar();
    return { ok: true };
  });
}

export async function borrarPrecio(id: string): Promise<Resultado> {
  return protegido(async () => {
    const { error } = await createServerClient().from("pricing_categories").delete().eq("id", id);
    if (error) throw error;
    refrescar();
    return { ok: true };
  });
}
