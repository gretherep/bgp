import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getAuthenticatedUser } from "@/utils/auth";
import * as ProfileService from "@/services/profiles";

// GET: obtener todos los perfiles (solo admin)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await ProfileService.getAllProfiles();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: actualizar perfil o password (solo admin)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, name, role, first_name, last_name, password } = body;
    if (!id) return NextResponse.json({ error: "User id required" }, { status: 400 });

    if (password) {
      await ProfileService.updateUserPassword(id, password);
    }

    const data = await ProfileService.updateProfile(id, { name, role, first_name, last_name });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: eliminar perfil y usuario (solo admin)
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await ProfileService.deleteProfile(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET profile for current user (me)
export async function POST(req: NextRequest) {
  // This could also be a GET /api/users/me, but let's keep it consistent
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profile = await ProfileService.getProfileById(user.id);
    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
