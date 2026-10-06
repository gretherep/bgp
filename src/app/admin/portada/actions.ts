"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/utils/auth";
import { createServerClient } from "@/utils/supabaseServer";
import { CARD_FIELDS } from "@/lib/catalogQuery";
import type { HomeMedia } from "@/lib/catalog";

export type Resultado<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const LIMITES = { frase: 200, razon: 70, razones: 3, titulo: 90, subtitulo: 140, badge: 14, cta: 24, mensaje: 300 };

async function protegido<T>(fn: () => Promise<Resultado<T>>): Promise<Resultado<T>> {
  try {
    await requireAdminAction();
  } catch {
    return { ok: false, error: "Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión." };
  }
  try {
    return await fn();
  } catch (e) {
    console.error("[admin/portada]", e);
    return { ok: false, error: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
  }
}

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fecha = (v: unknown): string | null => {
  const s = texto(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

// ── Títulos ───────────────────────────────────────────────────────────

export async function buscarTitulos(q: string): Promise<Resultado<HomeMedia[]>> {
  return protegido(async () => {
    const termino = texto(q).replace(/[%,()]/g, " ").trim();
    let consulta = createServerClient().from("media").select(CARD_FIELDS).limit(12);
    consulta = termino
      ? consulta.ilike("title", `%${termino}%`).order("year", { ascending: false })
      : consulta.order("created_at", { ascending: false });
    const { data, error } = await consulta;
    if (error) throw error;
    return { ok: true, data: (data ?? []) as unknown as HomeMedia[] };
  });
}

// ── Recomendada de la semana ──────────────────────────────────────────

export type RecomendacionInput = { media_id: string; frase: string; razones: string[]; desde: string; hasta: string | null };

export async function publicarRecomendacion(input: RecomendacionInput): Promise<Resultado> {
  return protegido(async () => {
    const frase = texto(input.frase);
    const razones = (input.razones ?? []).map(texto).filter(Boolean);
    const desde = fecha(input.desde) ?? new Date().toISOString();
    const hasta = fecha(input.hasta);

    if (!input.media_id) return { ok: false, error: "Elige el título que quieres recomendar." };
    if (frase.length < 10) return { ok: false, error: "Escribe una frase gancho (mínimo 10 caracteres)." };
    if (frase.length > LIMITES.frase) return { ok: false, error: `La frase no puede pasar de ${LIMITES.frase} caracteres.` };
    if (razones.length > LIMITES.razones) return { ok: false, error: "Máximo 3 razones." };
    if (razones.some((r) => r.length > LIMITES.razon)) return { ok: false, error: `Cada razón debe tener hasta ${LIMITES.razon} caracteres.` };
    if (hasta && hasta <= desde) return { ok: false, error: "La fecha de fin debe ser posterior a la de inicio." };

    const sb = createServerClient();
    const { data: media } = await sb.from("media").select("id").eq("id", input.media_id).maybeSingle();
    if (!media) return { ok: false, error: "Ese título ya no existe en el catálogo." };

    // Solo una activa (índice único parcial): primero se desactiva la anterior.
    const off = await sb.from("recomendacion").update({ activa: false }).eq("activa", true);
    if (off.error) throw off.error;
    const ins = await sb.from("recomendacion").insert({ media_id: input.media_id, frase, razones, desde, hasta, activa: true });
    if (ins.error) throw ins.error;

    revalidatePath("/");
    revalidatePath("/admin/portada");
    return { ok: true };
  });
}

export async function quitarRecomendacion(): Promise<Resultado> {
  return protegido(async () => {
    const { error } = await createServerClient().from("recomendacion").update({ activa: false }).eq("activa", true);
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/admin/portada");
    return { ok: true };
  });
}

// ── Promos ───────────────────────────────────────────────────────────

export type PromoInput = {
  id?: string;
  kind: "strip" | "card";
  titulo: string;
  subtitulo: string;
  badge: string;
  cta_label: string;
  cta_mensaje: string;
  min_items: number | null;
  desde: string;
  hasta: string | null;
  activa: boolean;
};

function validarPromo(p: PromoInput) {
  const fila = {
    kind: p.kind === "strip" ? "strip" : "card",
    titulo: texto(p.titulo),
    subtitulo: texto(p.subtitulo) || null,
    badge: texto(p.badge) || null,
    cta_label: texto(p.cta_label) || null,
    cta_mensaje: texto(p.cta_mensaje) || null,
    min_items: p.min_items && p.min_items > 0 ? Math.min(Math.floor(p.min_items), 999) : null,
    desde: fecha(p.desde) ?? new Date().toISOString(),
    hasta: fecha(p.hasta),
    activa: !!p.activa,
  };
  if (fila.titulo.length < 3) return { error: "El título de la promo es obligatorio." };
  if (fila.titulo.length > LIMITES.titulo) return { error: `El título no puede pasar de ${LIMITES.titulo} caracteres.` };
  if ((fila.subtitulo?.length ?? 0) > LIMITES.subtitulo) return { error: `El subtítulo no puede pasar de ${LIMITES.subtitulo} caracteres.` };
  if ((fila.badge?.length ?? 0) > LIMITES.badge) return { error: `La etiqueta no puede pasar de ${LIMITES.badge} caracteres.` };
  if ((fila.cta_label?.length ?? 0) > LIMITES.cta) return { error: `El texto del botón no puede pasar de ${LIMITES.cta} caracteres.` };
  if ((fila.cta_mensaje?.length ?? 0) > LIMITES.mensaje) return { error: `El mensaje no puede pasar de ${LIMITES.mensaje} caracteres.` };
  if (fila.hasta && fila.hasta <= fila.desde) return { error: "La fecha de fin debe ser posterior a la de inicio." };
  return { fila };
}

export async function guardarPromo(input: PromoInput): Promise<Resultado<{ id: string }>> {
  return protegido(async () => {
    const v = validarPromo(input);
    if ("error" in v) return { ok: false, error: v.error! };
    const sb = createServerClient();

    if (input.id) {
      const { error } = await sb.from("promos").update(v.fila).eq("id", input.id);
      if (error) throw error;
      revalidatePath("/");
      revalidatePath("/admin/portada");
      return { ok: true, data: { id: input.id } };
    }

    // Nueva: arriba de todo (mayor prioridad).
    const { data: tope } = await sb.from("promos").select("prioridad").order("prioridad", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await sb
      .from("promos")
      .insert({ ...v.fila, prioridad: (tope?.prioridad ?? 0) + 1 })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/admin/portada");
    return { ok: true, data: { id: data.id as string } };
  });
}

export async function cambiarActivaPromo(id: string, activa: boolean): Promise<Resultado> {
  return protegido(async () => {
    const { error } = await createServerClient().from("promos").update({ activa }).eq("id", id);
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/admin/portada");
    return { ok: true };
  });
}

export async function borrarPromo(id: string): Promise<Resultado> {
  return protegido(async () => {
    const { error } = await createServerClient().from("promos").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/admin/portada");
    return { ok: true };
  });
}

/** Recibe los ids en el orden deseado (el primero, más prioridad). */
export async function reordenarPromos(ids: string[]): Promise<Resultado> {
  return protegido(async () => {
    const sb = createServerClient();
    const total = ids.length;
    const res = await Promise.all(ids.map((id, i) => sb.from("promos").update({ prioridad: total - i }).eq("id", id)));
    const fallo = res.find((r) => r.error);
    if (fallo?.error) throw fallo.error;
    revalidatePath("/");
    revalidatePath("/admin/portada");
    return { ok: true };
  });
}
