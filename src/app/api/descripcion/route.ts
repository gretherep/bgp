import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabaseServer";
import { requireAdmin } from "@/utils/auth";

export async function GET(req: NextRequest) {

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("business_info")
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
