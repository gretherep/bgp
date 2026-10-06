import { NextRequest, NextResponse } from "next/server";
import { filtrosDesdeParams } from "@/lib/categories";
import { getCatalogo } from "@/lib/catalogQuery";

// Catálogo público paginado (24 por página). Respuesta cacheada en la CDN.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filtros = filtrosDesdeParams(params);
  const page = Math.min(Math.max(parseInt(params.get("page") ?? "1", 10) || 1, 1), 200);
  const soloTotal = params.get("solo") === "total";

  try {
    const data = await getCatalogo(filtros, page, soloTotal);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("GET /api/catalog:", error);
    return NextResponse.json({ error: "No se pudo cargar el catálogo" }, { status: 500 });
  }
}
