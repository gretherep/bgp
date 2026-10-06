// Datos fijos del sitio. Lo editable (precios, WhatsApp, descripción) vive en
// business_info / pricing_categories y se gestiona desde el admin.
export const SITE = {
  name: "BGP Paquete",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://paquete-bgp.vercel.app",
  paqueteTamano: "1 TB",
  // Respaldo si business_info.whatsapp_url está vacío
  whatsapp: "https://wa.me/5350623401",
  description:
    "Paquete semanal de 1 TB a domicilio: películas, series, anime, novelas y realities. Mira los estrenos de la semana y pide por WhatsApp.",
} as const;
