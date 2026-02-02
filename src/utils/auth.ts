import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "./supabaseServer";
import { createRequestClient } from "./supabaseRequest";

export async function getAuthenticatedUser(request: NextRequest) {
    const supabase = createServerClient();
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    return user;
}

export async function requireAdmin(request: NextRequest) {
    const user = await getAuthenticatedUser(request);
    if (!user) {
        return { error: "Unauthorized", status: 401 };
    }

    const supabase = createServerClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { error: "Forbidden: Admin access required", status: 403 };
    }

    return { user };
}

/**
 * Se utiliza para proteger Server Actions directamente
 */
export async function requireAdminAction() {
    try {
        const supabaseRequest = await createRequestClient();
        const { data: { user }, error: authError } = await supabaseRequest.auth.getUser();

        if (authError || !user) {
            throw new Error("No autorizado: Sesión inválida o expirada");
        }

        const supabaseAdmin = createServerClient();
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            throw new Error("No autorizado: No se pudo verificar el perfil");
        }

        if (profile.role !== "admin") {
            throw new Error("No autorizado: Se requiere rol de administrador");
        }

        return user;
    } catch (err: any) {
        console.error("Error in requireAdminAction:", err.message);
        throw err;
    }
}
