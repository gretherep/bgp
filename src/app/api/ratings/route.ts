import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/auth";
import * as RatingsService from "@/services/ratings";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { mediaId, rating } = body;

    if (!mediaId || !rating) {
      return NextResponse.json(
        { error: "mediaId and rating are required" },
        { status: 400 }
      );
    }

    await RatingsService.upsertRating({
      media_id: mediaId,
      user_id: user.id,
      rating,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
