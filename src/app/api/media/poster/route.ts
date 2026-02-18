import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/auth";
import { createServerClient } from "@/utils/supabaseServer";

const POSTER_BUCKET = "posters";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const fileNameFromForm = formData.get("fileName");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const originalName = file.name || "upload";
    const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
    const fileName = typeof fileNameFromForm === "string" && fileNameFromForm.trim()
      ? fileNameFromForm.trim()
      : `${Date.now()}.${ext}`;

    const supabase = createServerClient();
    const { error: uploadError } = await supabase.storage
      .from(POSTER_BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from(POSTER_BUCKET)
      .getPublicUrl(fileName);

    return NextResponse.json({ publicUrl: publicUrlData.publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
