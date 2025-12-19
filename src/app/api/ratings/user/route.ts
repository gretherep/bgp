import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabaseServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId");
  const userId = searchParams.get("userId");

  if (!mediaId || !userId) {
    return NextResponse.json({ rating: null });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("media_id", mediaId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ rating: null });
  }

  return NextResponse.json({ rating: data.rating });
}
