import { NextResponse } from "next/server";
import { getPedidoConfig } from "@/lib/catalog";

// Datos para el panel "Mi pedido": tarifas, WhatsApp y promo con mínimo de títulos.
export async function GET() {
  try {
    const data = await getPedidoConfig();
    return NextResponse.json(data, {
      // Caché corta: si la admin cambia una promo o un precio, "Mi pedido" lo refleja en ~1 minuto
      // (el panel no puede vaciar la caché de la CDN de una ruta como esta). Pesa ~1 KB.
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("GET /api/pedido-config:", error);
    return NextResponse.json({ error: "No se pudo cargar la configuración del pedido" }, { status: 500 });
  }
}
