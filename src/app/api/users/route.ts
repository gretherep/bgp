// app/api/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

// Función de utilidad para validar admin
async function requireAdmin(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data || data.role !== "admin") {
    throw new Error("Unauthorized: admin only");
  }
}

// GET: obtener todos los perfiles (solo admin)
export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id"); // Pasar userId desde frontend
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  try {
    await requireAdmin(userId);
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

// PATCH: actualizar perfil (solo admin)
export async function PATCH(req: NextRequest) {
  const userId = req.headers.get("x-user-id"); // admin que realiza la acción
  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  try {
    await requireAdmin(userId);

    const body = await req.json();
    const { id, name, role } = body;
    if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("profiles")
      .update({ name, role })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
