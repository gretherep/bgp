import { NextResponse } from "next/server";
import { getPedidoConfig } from "@/lib/catalog";

// Datos para el panel "Mi pedido": tarifas, WhatsApp y promo con mínimo de títulos.
export async function GET() {
  try {
    const data = await getPedidoConfig();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("GET /api/pedido-config:", error);
    return NextResponse.json({ error: "No se pudo cargar la configuración del pedido" }, { status: 500 });
  }
}
