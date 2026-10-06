"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/utils/auth";
import { createServerClient } from "@/utils/supabaseServer";
import { LIMITES_NEGOCIO } from "./limites";

export type Resultado<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const LOGOS = "logo";
const MAX_LOGO_BYTES = 500 * 1024;

async function protegido<T>(fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    await requireAdminAction();
  } catch {
    return { ok: false, error: "Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión." };
  }
  try {
    return await fn();
  } catch (e) {
    console.error("[admin/negocio]", e);
    return { ok: false, error: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
  }
}

// WhatsApp y horario salen en todo el sitio (Inicio, Mi pedido, promos) y en /descripcion.
function refrescar() {
  revalidatePath("/");
  revalidatePath("/descripcion");
  revalidatePath("/admin/descripcion");
  revalidatePath("/admin/portada");
}

export type NegocioInput = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  telefono: string; // 8 dígitos (Cuba) o con 53 delante
  horario: string | null; // null: la columna no existe todavía
};

/** "50623401", "+53 5062 3401" o "5350623401" → "5350623401"; null si no es un móvil cubano. */
function normalizarTelefono(v: string): string | null {
  const d = v.replace(/\D/g, "");
  const local = d.length === 10 && d.startsWith("53") ? d.slice(2) : d;
  return /^5\d{7}$/.test(local) ? `53${local}` : null;
}

export async function guardarNegocio(input: NegocioInput): Promise<Resultado> {
  return protegido(async () => {
    const titulo = (input.title ?? "").trim().replace(/\s+/g, " ");
    const descripcion = (input.description ?? "").trim();
    const telefono = normalizarTelefono(input.telefono ?? "");

    if (!titulo) return { ok: false, error: "Escribe el título." };
    if (titulo.length > LIMITES_NEGOCIO.titulo) return { ok: false, error: `El título es demasiado largo (máx. ${LIMITES_NEGOCIO.titulo}).` };
    if (descripcion.length > LIMITES_NEGOCIO.descripcion) return { ok: false, error: `La descripción es demasiado larga (máx. ${LIMITES_NEGOCIO.descripcion}).` };
    if (!telefono) return { ok: false, error: "El WhatsApp debe ser un móvil cubano de 8 dígitos, por ejemplo 50623401." };
    if (input.image_url && !/^https:\/\//.test(input.image_url)) return { ok: false, error: "El logo no es válido." };

    const fila: Record<string, string | null> = {
      title: titulo,
      description: descripcion || null,
      image_url: input.image_url || null,
      whatsapp_url: `https://wa.me/${telefono}`,
    };
    if (input.horario !== null) {
      const horario = input.horario.trim().replace(/\s+/g, " ");
      if (horario.length > LIMITES_NEGOCIO.horario) return { ok: false, error: `El horario es demasiado largo (máx. ${LIMITES_NEGOCIO.horario}).` };
      fila.horario = horario || null;
    }

    const { error } = await createServerClient().from("business_info").update(fila).eq("id", input.id);
    if (error) throw error;
    refrescar();
    return { ok: true };
  });
}

/** Recibe el logo ya comprimido en el navegador y devuelve su URL pública (no toca la base hasta Guardar). */
export async function subirLogo(formData: FormData): Promise<Resultado<{ url: string }>> {
  return protegido(async () => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No llegó ninguna imagen." };
    if (!file.type.startsWith("image/")) return { ok: false, error: "El archivo no es una imagen." };
    if (file.size > MAX_LOGO_BYTES) return { ok: false, error: "El logo pesa demasiado incluso comprimido. Prueba con otro más pequeño." };

    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const nombre = `logo-${crypto.randomUUID()}.${ext}`;
    const sb = createServerClient();
    const { error } = await sb.storage.from(LOGOS).upload(nombre, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
    if (error) throw error;
    return { ok: true, data: { url: sb.storage.from(LOGOS).getPublicUrl(nombre).data.publicUrl } };
  });
}
