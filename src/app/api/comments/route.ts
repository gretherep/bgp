import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener rol desde tabla profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return user; // ✅ usuario válido y admin
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user; // Si no es admin, responde aquí

  const { searchParams } = new URL(request.url);
  const media_id = searchParams.get("media_id");
  if (!media_id) {
    return NextResponse.json({ error: "media_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("media_id", media_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { user_id, media_id, comment } = body;

    if (!user_id || !media_id || !comment) {
      return NextResponse.json(
        { error: "user_id, media_id and comment are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([{ user_id, media_id, comment }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
