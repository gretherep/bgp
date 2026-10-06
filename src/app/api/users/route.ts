import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/auth";
import * as ProfileService from "@/services/profiles";

// Perfil del usuario actual (lo usa useAuth). La gestión de usuarios vive en app/admin/profiles/actions.ts.
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profile = await ProfileService.getProfileById(user.id);
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
