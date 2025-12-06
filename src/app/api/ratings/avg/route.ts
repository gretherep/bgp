import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabaseServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId");

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId requerido" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("media_id", mediaId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ avg: 0 });
  }

  const total = data.reduce((acc, r) => acc + r.rating, 0);
  const avg = total / data.length;

  return NextResponse.json({ avg: Number(avg.toFixed(1)) });
}
