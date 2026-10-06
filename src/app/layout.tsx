import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";
import { SITE } from "@/lib/site";
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
};

export const viewport: Viewport = {
  themeColor: "#161616",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-secondary)]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
