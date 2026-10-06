import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase con la sesión del usuario (cookies de la petición).
 * Usa getAll/setAll: la API get/set/remove está deprecada en @supabase/ssr 0.8 y no
 * encuentra la sesión cuando la cookie se guarda entera con prefijo "base64-" o en trozos.
 */
export async function createRequestClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Desde un Server Component no se pueden escribir cookies; la renovación la hace proxy.ts.
          }
        },
      },
    }
  );
}
