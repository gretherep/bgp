"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics: visitantes, páginas vistas, de dónde llegan (WhatsApp, Google…), país y dispositivo.
 * Sin cookies. El script (~1 KB) se sirve desde el mismo dominio (/_vercel/insights), así que no lo
 * bloquean filtros de terceros. Solo funciona en el sitio publicado en Vercel (en local no envía nada).
 * Las visitas del panel (/admin) no se cuentan: son de la administradora, no de clientes.
 */
export default function Analitica() {
  return <Analytics beforeSend={(e: BeforeSendEvent) => (new URL(e.url).pathname.startsWith("/admin") ? null : e)} />;
}
