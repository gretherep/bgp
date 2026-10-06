import type { Metadata } from "next";
import { CATEGORIAS } from "@/lib/categories";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

// La guarda el service worker al instalarse y la muestra cuando una página no está guardada y no hay red.
// Todo son enlaces simples: tiene que funcionar aunque los scripts del sitio no estén en el teléfono.
export const metadata: Metadata = { title: "Sin conexión", robots: { index: false } };
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-5xl" aria-hidden="true">📡</p>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">Estás sin conexión</h1>
      <p className="mt-2 text-sm text-white/70 sm:text-base">
        Esta página todavía no está guardada en tu teléfono. Las que ya abriste antes se pueden ver sin datos.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {/* <a> y no <Link>: recarga completa, que es lo que sirve para reintentar sin red */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-black">
          Volver a intentar
        </a>
        <a
          href={waLink(null, "Hola 👋 quiero hacer un pedido")}
          className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-sm font-black text-black"
        >
          <WhatsAppIcon className="h-4 w-4" /> Escribir por WhatsApp
        </a>
      </div>

      <p className="mt-10 text-xs font-bold uppercase tracking-wider text-accent">Prueba con</p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {CATEGORIAS.map((c) => (
          <li key={c.slug}>
            <a href={`/category/${c.slug}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[13px] font-bold text-white/80">
              <span aria-hidden="true">{c.emoji}</span>
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
