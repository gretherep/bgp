import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET(request: NextRequest) {
  try {
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
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, media_id, comment } = body;

    if (!user_id || !media_id || !comment) {
      return NextResponse.json({ error: "user_id, media_id and comment are required" }, { status: 400 });
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
