import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabaseServer";

// Helper para proteger rutas admin
async function requireAdmin(req: NextRequest | Request) {
  const supabase = createServerClient();

  // Para NextRequest (GET) obtenemos token desde headers, para Request (PATCH) podrías enviar Authorization
  const token = req instanceof NextRequest 
    ? req.headers.get("Authorization")?.replace("Bearer ", "")
    : null;

  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return user;
}

export async function GET(req: NextRequest) {

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("business_info")
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const supabase = createServerClient();

    const {
      title,
      description,
      image_url,
      price_basic,
      price_standard,
      price_premium,
      whatsapp_url,
      telegram_url
    } = body;

    const { error } = await supabase
      .from("business_info")
      .update({
        title,
        description,
        image_url,
        price_basic,
        price_standard,
        price_premium,
        whatsapp_url,
        telegram_url
      })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
