"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { CATEGORIAS } from "@/lib/categories";
import { waLink } from "@/lib/whatsapp";
import { useHojaModal } from "@/hooks/useHojaModal";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

const NAV = [
  { name: "Inicio", href: "/", emoji: "🏠" },
  ...CATEGORIAS.map((c) => ({ name: c.label, href: `/category/${c.slug}`, emoji: c.emoji })),
  { name: "Precios", href: "/descripcion", emoji: "💰" },
];

const PEDIR = waLink(null, "Hola 👋 quiero información sobre el paquete semanal");

/** @supabase/ssr guarda la sesión en la cookie `sb-<proyecto>-auth-token` (a veces en trozos .0, .1). */
function haySesionGuardada(): boolean {
  try {
    return /(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie) || Object.keys(localStorage).some((k) => /^sb-.*-auth-token/.test(k));
  } catch {
    return false;
  }
}

interface NavbarProps {
  onOpenLogin: () => void;
  onShowMessage: (msg: string) => void;
  onConfirmLogout: () => void;
}

function Icono({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const I = {
  buscar: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  usuario: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  salir: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M4 6h16M4 12h16M4 18h16",
  cerrar: "M18 6 6 18M6 6l12 12",
};

export default function Navbar({ onOpenLogin, onConfirmLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [termino, setTermino] = useState("");
  const [menu, setMenu] = useState(false);
  const inputMovil = useRef<HTMLInputElement>(null);

  // Supabase (~55 KB) se carga solo si hay una sesión guardada o cuando alguien va a iniciar
  // sesión: la mayoría de los visitantes navega sin cuenta y no lo descarga.
  const conectado = useRef<(() => void) | null>(null);
  const conectarAuth = useCallback(async () => {
    if (conectado.current) return;
    conectado.current = () => {};
    const { supabase } = await import("@/utils/supabaseClient");
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    const { data: listener } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, s: Session | null) => setSession(s));
    conectado.current = () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (haySesionGuardada()) conectarAuth();
    return () => conectado.current?.();
  }, [conectarAuth]);

  const abrirLogin = () => {
    conectarAuth();
    onOpenLogin();
  };

  useEffect(() => {
    if (buscando) inputMovil.current?.focus();
  }, [buscando]);

  const activo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    const q = termino.trim();
    if (!q) return;
    router.push(`/search?query=${encodeURIComponent(q)}`);
    setTermino("");
    setBuscando(false);
  };

  const campoBusqueda = (movil: boolean) => (
    <form onSubmit={buscar} role="search" className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
        <Icono d={I.buscar} className="h-4 w-4" />
      </span>
      <input
        ref={movil ? inputMovil : undefined}
        type="search"
        value={termino}
        onChange={(e) => setTermino(e.target.value)}
        placeholder="Buscar película, serie…"
        aria-label="Buscar en el catálogo"
        enterKeyHint="search"
        className="h-10 w-full rounded-full border border-white/10 bg-white/[0.06] pl-9 pr-4 text-sm text-white placeholder:text-white/40 transition focus:border-primary/60 focus:bg-white/[0.09] focus:outline-none"
      />
    </form>
  );

  const botonIcono = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white";

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 h-16 border-b border-white/[0.06] bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:gap-6 lg:px-10">
          {buscando ? (
            /* Búsqueda abierta (hasta 1279 px): ocupa toda la barra */
            <div className="flex w-full items-center gap-2 xl:hidden">
              {campoBusqueda(true)}
              <button type="button" onClick={() => setBuscando(false)} className="shrink-0 px-2 text-sm font-bold text-white/70 hover:text-white">
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <Link href="/" aria-label="BGP Paquete, ir al inicio" className="flex shrink-0 items-center gap-2.5">
                <Image src="/images/Logo.png" alt="" width={40} height={40} sizes="40px" priority className="h-10 w-10 rounded-full" />
                <span className="hidden text-[15px] font-black tracking-tight text-white sm:block lg:hidden xl:block">
                  BGP <span className="text-primary">Paquete</span>
                </span>
              </Link>

              {/* PC: enlaces en línea */}
              <ul className="hidden items-center gap-1 lg:flex">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={activo(item.href) ? "page" : undefined}
                      className={`relative block rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors xl:px-3 ${
                        activo(item.href) ? "text-primary" : "text-white/75 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {item.name}
                      {activo(item.href) && <span className="absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded-full bg-primary xl:inset-x-3" />}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                {/* Campo fijo solo desde 1280 px; antes, ícono que despliega la búsqueda (en 1024 no caben los 8 enlaces + campo) */}
                <div className="hidden w-56 xl:block 2xl:w-64">{campoBusqueda(false)}</div>
                <button type="button" onClick={() => setBuscando(true)} aria-label="Buscar" className={`${botonIcono} xl:hidden`}>
                  <Icono d={I.buscar} />
                </button>

                <a
                  href={PEDIR}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Pedir por WhatsApp"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-whatsapp px-3 text-sm font-black text-black transition hover:brightness-110 active:scale-95 sm:px-4"
                >
                  <WhatsAppIcon className="h-[18px] w-[18px]" />
                  <span className="hidden sm:inline">Pedir</span>
                </a>

                <button
                  type="button"
                  onClick={session ? onConfirmLogout : abrirLogin}
                  aria-label={session ? "Cerrar sesión" : "Iniciar sesión"}
                  title={session ? "Cerrar sesión" : "Iniciar sesión"}
                  className={`${botonIcono} hidden sm:flex`}
                >
                  <Icono d={session ? I.salir : I.usuario} />
                </button>

                <button type="button" onClick={() => setMenu(true)} aria-label="Abrir menú" aria-expanded={menu} className={`${botonIcono} lg:hidden`}>
                  <Icono d={I.menu} />
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {menu && (
        <MenuMovil
          activo={activo}
          session={!!session}
          onLogin={abrirLogin}
          onLogout={onConfirmLogout}
          onCerrado={(href) => {
            setMenu(false);
            if (href) router.push(href);
          }}
        />
      )}
    </>
  );
}

/** Panel lateral (móvil y tablet). Navegar primero cierra el panel (y su entrada del historial). */
function MenuMovil({
  activo,
  session,
  onLogin,
  onLogout,
  onCerrado,
}: {
  activo: (href: string) => boolean;
  session: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onCerrado: (href: string | null) => void;
}) {
  const destino = useRef<string | null>(null);
  const accion = useRef<(() => void) | null>(null);
  const cerrar = useHojaModal(() => {
    onCerrado(destino.current);
    accion.current?.();
  });

  const ir = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    destino.current = activo(href) ? null : href;
    cerrar();
  };
  const ejecutar = (fn: () => void) => {
    accion.current = fn;
    cerrar();
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
      <button type="button" aria-label="Cerrar menú" onClick={cerrar} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative flex h-full w-[86%] max-w-sm animate-fade-up flex-col border-l border-white/10 bg-surface [animation-duration:200ms]">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <span className="text-base font-black text-white">
            BGP <span className="text-primary">Paquete</span>
          </span>
          <button type="button" onClick={cerrar} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
            <Icono d={I.cerrar} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => ir(e, item.href)}
                  aria-current={activo(item.href) ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-bold transition ${
                    activo(item.href) ? "bg-primary/15 text-primary" : "text-white/85 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-lg" aria-hidden="true">{item.emoji}</span>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <a
            href={PEDIR}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp py-3 text-sm font-black text-black"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" /> Escríbenos por WhatsApp
          </a>
          <button
            type="button"
            onClick={() => ejecutar(session ? onLogout : onLogin)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 py-3 text-sm font-bold text-white"
          >
            <Icono d={session ? I.salir : I.usuario} className="h-4 w-4" />
            {session ? "Cerrar sesión" : "Iniciar sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
