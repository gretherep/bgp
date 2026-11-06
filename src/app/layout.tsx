import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";
import Analitica from "@/components/Analitica";
import { SITE } from "@/lib/site";
import { SCRIPT_TEMA } from "@/lib/tema";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · Paquete semanal de ${SITE.paqueteTamano}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "es_CU",
    siteName: SITE.name,
    title: `${SITE.name} · Paquete semanal de ${SITE.paqueteTamano}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  // Ícono y barra al guardar el sitio en la pantalla de inicio (iPhone; Android usa manifest.ts).
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "BGP Paquete", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#D9D9D9",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: SCRIPT_TEMA añade la clase "dark" antes de que React hidrate
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)]">
        <AppShell>{children}</AppShell>
        <Analitica />
      </body>
    </html>
  );
}
