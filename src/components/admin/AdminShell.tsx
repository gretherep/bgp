"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, Film, LayoutDashboard, LogOut, MoreHorizontal, Sparkles, Store, Tag, Users } from "lucide-react";
import { useHojaModal } from "@/hooks/useHojaModal";

const SECCIONES = [
  { name: "Resumen", href: "/admin/dashboard", Icon: LayoutDashboard },
  { name: "Portada", href: "/admin/portada", Icon: Sparkles },
  { name: "Catálogo", href: "/admin/media", Icon: Film },
  { name: "Precios", href: "/admin/pricing-categories", Icon: Tag },
  { name: "Negocio", href: "/admin/descripcion", Icon: Store },
  { name: "Usuarios", href: "/admin/profiles", Icon: Users },
];
// En la barra inferior del móvil van las 4 de uso diario; el resto en "Más".
const EN_BARRA = SECCIONES.slice(0, 4);
const EN_MAS = SECCIONES.slice(4);

async function cerrarSesion() {
  const { supabase } = await import("@/utils/supabaseClient");
  await supabase.auth.signOut({ scope: "local" }); // solo este dispositivo
}

export default function AdminShell({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mas, setMas] = useState(false);
  const activo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const actual = SECCIONES.find((s) => activo(s.href));

  const salir = async () => {
    await cerrarSesion();
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-secondary">
      {/* ── Sidebar (PC) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-surface lg:flex">
        <Link href="/admin/dashboard" className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <Image src="/images/Logo.png" alt="" width={36} height={36} sizes="36px" className="h-9 w-9 rounded-full" />
          <span className="leading-tight">
            <span className="block text-sm font-black text-white">
              BGP <span className="text-primary">Paquete</span>
            </span>
            <span className="block text-[11px] font-semibold text-accent">Panel de administración</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {SECCIONES.map(({ name, href, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                activo(href) ? "bg-primary/15 text-primary" : "text-white/75 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {name}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/75 hover:bg-white/[0.05] hover:text-white">
            <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" /> Ver sitio
          </a>
          <button type="button" onClick={salir} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/75 hover:bg-offer/10 hover:text-red-200">
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Cerrar sesión
          </button>
          <p className="truncate px-3 pt-1 text-[11px] text-accent">Sesión: {nombre}</p>
        </div>
      </aside>

      {/* ── Cabecera (móvil/tablet) ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-background/90 px-4 backdrop-blur-md lg:hidden">
        <Image src="/images/Logo.png" alt="" width={32} height={32} sizes="32px" className="h-8 w-8 rounded-full" />
        <span className="flex-1 truncate text-base font-black text-white">{actual?.name ?? "Panel"}</span>
        <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-bold text-white/80">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Ver sitio
        </a>
      </header>

      <main className="px-4 pb-28 pt-5 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* ── Barra inferior (móvil/tablet) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Secciones del panel">
        <ul className="grid grid-cols-5">
          {EN_BARRA.map(({ name, href, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo(href) ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold ${activo(href) ? "text-primary" : "text-white/60"}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {name}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMas(true)}
              className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-bold ${EN_MAS.some((s) => activo(s.href)) ? "text-primary" : "text-white/60"}`}
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              Más
            </button>
          </li>
        </ul>
      </nav>

      {mas && <HojaMas activo={activo} onSalir={salir} onCerrado={(href) => { setMas(false); if (href) router.push(href); }} />}
    </div>
  );
}

function HojaMas({
  activo,
  onSalir,
  onCerrado,
}: {
  activo: (href: string) => boolean;
  onSalir: () => void;
  onCerrado: (href: string | null) => void;
}) {
  const destino = useRef<string | null>(null);
  const salir = useRef(false);
  const cerrar = useHojaModal(() => {
    onCerrado(destino.current);
    if (salir.current) onSalir();
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-end lg:hidden" role="dialog" aria-modal="true" aria-label="Más secciones">
      <button type="button" aria-label="Cerrar" onClick={cerrar} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full animate-fade-up rounded-t-3xl border border-b-0 border-white/10 bg-surface p-3 pb-[max(1rem,env(safe-area-inset-bottom))] [animation-duration:200ms]">
        <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
        {EN_MAS.map(({ name, href, Icon }) => (
          <button
            key={href}
            type="button"
            onClick={() => {
              destino.current = activo(href) ? null : href;
              cerrar();
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-bold ${activo(href) ? "bg-primary/15 text-primary" : "text-white/85"}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" /> {name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            salir.current = true;
            cerrar();
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-bold text-red-200"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
