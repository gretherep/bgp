import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, requireAdmin } from "@/utils/auth";
import * as CommentService from "@/services/comments";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const media_id = searchParams.get("media_id");
  if (!media_id) {
    return NextResponse.json({ error: "media_id is required" }, { status: 400 });
  }

  try {
    const data = await CommentService.getCommentsByMediaId(media_id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { media_id, comment } = body;

    if (!media_id || !comment) {
      return NextResponse.json(
        { error: "media_id and comment are required" },
        { status: 400 }
      );
    }

    const data = await CommentService.createComment({
      user_id: user.id,
      media_id,
      comment
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  try {
    await CommentService.deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
