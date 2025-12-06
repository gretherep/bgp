// app/api/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllMedia, createMedia, updateMedia, deleteMedia, getMediaById } from "@/app/actions/media.actions";
import { supabase } from "@/utils/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const media = await getMediaById(id);
      return NextResponse.json(media);
    } else {
      const media = await getAllMedia();
      return NextResponse.json(media);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const userId = formData.get("userId") as string; // obligatorio para validar admin

  if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

  try {
    await createMedia(formData, userId); // createMedia ya valida que sea admin
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 }); // no autorizado o error
  }
}

export async function PUT(req: NextRequest) {
  const formData = await req.formData();
  const id = formData.get("id") as string;
  const userId = formData.get("userId") as string;

  if (!id || !userId) return NextResponse.json({ error: "ID and User ID are required" }, { status: 400 });

  try {
    await updateMedia(id, formData, userId); // updateMedia valida rol admin
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("userId");

  if (!id || !userId) return NextResponse.json({ error: "ID and User ID are required" }, { status: 400 });

  try {
    await deleteMedia(id, userId); // deleteMedia valida rol admin
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
