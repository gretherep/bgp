import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/auth";
import { createServerClient } from "@/utils/supabaseServer";

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if ("error" in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const supabase = createServerClient();

    try {
        // Basic Stats
        const [
            { count: totalMedia },
            { count: totalUsers },
            { count: totalRatings },
            { data: ratingsData }
        ] = await Promise.all([
            supabase.from("media").select("*", { count: "exact", head: true }),
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("ratings").select("*", { count: "exact", head: true }),
            supabase.from("ratings").select("rating")
        ]);

        const avgRating = ratingsData?.length
            ? ratingsData.reduce((a, b) => a + b.rating, 0) / ratingsData.length
            : 0;

        // Charts data (Last 7 days)
        const today = new Date();
        const week = [...Array(7)]
            .map((_, i) => {
                const d = new Date();
                d.setDate(today.getDate() - i);
                return d.toISOString().split("T")[0];
            })
            .reverse();

        const weeklyRatings = [];
        const weeklyMedia = [];

        // Note: For large datasets, this should be a single query with group by
        // But for this refactor, we maintain the logic but on the server
        for (const date of week) {
            const [
                { data: rData },
                { data: mData }
            ] = await Promise.all([
                supabase.from("ratings").select("id").gte("created_at", date).lte("created_at", date + "T23:59:59"),
                supabase.from("media").select("id").gte("created_at", date).lte("created_at", date + "T23:59:59")
            ]);

            const dayLabel = new Date(date).toLocaleDateString("es-ES", { weekday: "short" });
            weeklyRatings.push({ day: dayLabel, value: rData?.length || 0 });
            weeklyMedia.push({ day: dayLabel, value: mData?.length || 0 });
        }

        return NextResponse.json({
            stats: {
                totalMedia: totalMedia || 0,
                totalUsers: totalUsers || 0,
                totalRatings: totalRatings || 0,
                avgRating: Number(avgRating.toFixed(2)),
            },
            charts: {
                weeklyRatings,
                weeklyMedia
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
