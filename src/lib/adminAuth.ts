import "server-only";
import { cache } from "react";
import { createRequestClient } from "@/utils/supabaseRequest";
import { createServerClient } from "@/utils/supabaseServer";

export type AdminActual = { id: string; email: string | null; nombre: string };

/**
 * Admin de la petición actual (sesión por cookie + rol en `profiles`), o null.
 * `cache` evita repetir la consulta si layout y página la piden en el mismo render.
 */
export const getAdmin = cache(async (): Promise<AdminActual | null> => {
  const sb = await createRequestClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await createServerClient()
    .from("profiles")
    .select("role, first_name")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.role !== "admin") return null;
  return {
    id: user.id,
    email: user.email ?? null,
    nombre: (perfil.first_name as string | null)?.trim() || user.email?.split("@")[0] || "Admin",
  };
});
