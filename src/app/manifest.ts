import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Hace el sitio instalable como app en Android ("Agregar a la pantalla principal").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} · Paquete semanal`,
    short_name: "BGP Paquete",
    description: SITE.description,
    lang: "es",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#161616",
    theme_color: "#161616",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Mantener pulsado el ícono de la app muestra estos atajos.
    shortcuts: [
      { name: "Lo nuevo", url: "/?orden=recientes#catalogo", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Buscar", url: "/search", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Precios", url: "/descripcion", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
