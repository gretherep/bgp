"use server";

import { revalidatePath } from "next/cache";
import type { User } from "@supabase/supabase-js";
import { requireAdminAction } from "@/utils/auth";
import { createServerClient } from "@/utils/supabaseServer";

export type Resultado<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const ROLES = ["user", "admin"] as const;
const MIN_PASSWORD = 8;

async function protegido<T>(fn: (yo: User) => Promise<Resultado<T>>): Promise<Resultado<T>> {
  let yo: User;
  try {
    yo = await requireAdminAction();
  } catch {
    return { ok: false, error: "Tu sesión expiró o no tienes permiso. Vuelve a iniciar sesión." };
  }
  try {
    return await fn(yo);
  } catch (e) {
    console.error("[admin/usuarios]", e);
    return { ok: false, error: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." };
  }
}

export type UsuarioInput = { id: string; first_name: string; last_name: string; role: string; password: string };

export async function guardarUsuario(input: UsuarioInput): Promise<Resultado> {
  return protegido(async (yo) => {
    const nombre = (input.first_name ?? "").trim().replace(/\s+/g, " ");
    const apellido = (input.last_name ?? "").trim().replace(/\s+/g, " ");
    const password = input.password ?? "";
    if (!ROLES.includes(input.role as (typeof ROLES)[number])) return { ok: false, error: "Rol no válido." };
    if (nombre.length > 60 || apellido.length > 60) return { ok: false, error: "El nombre es demasiado largo." };
    // Así el panel nunca se queda sin admin, ni nadie pierde el acceso por error.
    if (input.id === yo.id && input.role !== "admin") return { ok: false, error: "No puedes quitarte tu propio rol de admin." };
    if (password && password.length < MIN_PASSWORD) return { ok: false, error: `La contraseña nueva debe tener al menos ${MIN_PASSWORD} caracteres.` };

    const sb = createServerClient();
    if (password) {
      const { error } = await sb.auth.admin.updateUserById(input.id, { password });
      if (error) throw error;
    }
    const { error } = await sb.from("profiles").update({ first_name: nombre || null, last_name: apellido || null, role: input.role }).eq("id", input.id);
    if (error) throw error;
    revalidatePath("/admin/profiles");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  });
}

/** Borra la cuenta (Auth) y su perfil. */
export async function borrarUsuario(id: string): Promise<Resultado> {
  return protegido(async (yo) => {
    if (id === yo.id) return { ok: false, error: "No puedes borrar tu propia cuenta desde aquí." };
    const sb = createServerClient();
    const { error: authError } = await sb.auth.admin.deleteUser(id);
    if (authError) throw authError;
    const { error } = await sb.from("profiles").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/profiles");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  });
}
