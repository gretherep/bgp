import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabaseServer";

// Lectura pública para /descripcion. La edición vive en app/admin/descripcion/actions.ts.
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("business_info")
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
