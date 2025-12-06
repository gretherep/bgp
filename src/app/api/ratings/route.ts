import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabaseServer";

export async function POST(req: Request) {
  try {
    const { mediaId, rating, userId } = await req.json();

    if (!mediaId || !rating || !userId) {
      return NextResponse.json(
        { error: "mediaId, rating y userId son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase.from("ratings").upsert(
      {
        media_id: mediaId,
        user_id: userId,
        rating,
      },
      {
        onConflict: "media_id,user_id", // ✅ AQUÍ ESTABA EL ERROR
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
