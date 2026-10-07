"use client";

import { useEffect, useState } from "react";

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const K_VISITAS = "bgp:visitas";
const K_DESCARTADO = "bgp:instalar-descartado";
const DIAS_SIN_INSISTIR = 30;

const leer = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const escribir = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};

/**
 * 1) Registra el service worker (solo en producción): offline y segunda visita casi sin datos.
 * 2) Aviso discreto "Instala BGP": desde la 2.ª visita, si no está instalada y no se descartó en 30 días.
 *    Android: botón "Instalar" (evento beforeinstallprompt). iPhone no tiene ese evento: el aviso explica
 *    los dos toques (Compartir → Agregar a inicio).
 */

/** iPhone/iPad sin la app instalada (en iPadOS el navegador se presenta como Mac con pantalla táctil). */
function esIosSinInstalar(): boolean {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const instalada = (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia("(display-mode: standalone)").matches;
  return ios && !instalada;
}
export default function AppInstalable() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      // Después de la carga, para no competir con la primera pintura.
      const registrar = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
      if (document.readyState === "complete") registrar();
      else window.addEventListener("load", registrar, { once: true });
    }

    // Cuenta una visita por sesión del navegador.
    try {
      if (!sessionStorage.getItem(K_VISITAS)) {
        sessionStorage.setItem(K_VISITAS, "1");
        escribir(K_VISITAS, String(Number(leer(K_VISITAS) ?? 0) + 1));
      }
    } catch {}

    const corresponde = () => {
      const descartado = Number(leer(K_DESCARTADO) ?? 0);
      return Number(leer(K_VISITAS) ?? 0) >= 2 && Date.now() - descartado >= DIAS_SIN_INSISTIR * 864e5;
    };
    const alPoderInstalar = (e: Event) => {
      e.preventDefault(); // sin el mini-aviso de Chrome: mostramos el nuestro cuando corresponde
      if (corresponde()) setEvento(e as EventoInstalar);
    };
    // iPhone: unos segundos después de entrar, para no tapar lo primero que se ve.
    const tIos = setTimeout(() => {
      if (esIosSinInstalar() && corresponde()) setIos(true);
    }, 4000);
    const alInstalar = () => setEvento(null);
    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      clearTimeout(tIos);
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (!evento && !ios) return null;

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "dismissed") escribir(K_DESCARTADO, String(Date.now()));
    setEvento(null);
  };
  const descartar = () => {
    escribir(K_DESCARTADO, String(Date.now()));
    setEvento(null);
    setIos(false);
  };

  return (
    <div role="region" aria-label="Instalar la app" className="fixed inset-x-0 top-16 z-[60] animate-fade-up px-3 pt-2 [animation-duration:250ms] sm:left-auto sm:right-4 sm:w-[360px] sm:px-0">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-surface/95 p-3 shadow-2xl backdrop-blur-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">Instala BGP en tu teléfono</p>
          {evento ? (
            <p className="text-xs text-accent">Abre más rápido y gasta menos datos.</p>
          ) : (
            <p className="text-xs leading-relaxed text-white/75">
              Toca{" "}
              <span className="inline-flex items-center gap-0.5 font-bold text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="inline h-3.5 w-3.5 text-[#0a84ff]" aria-hidden="true">
                  <path d="M12 3v12M8 7l4-4 4 4M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
                </svg>
                Compartir
              </span>{" "}
              y luego <span className="font-bold text-white">«Agregar a inicio»</span>.
            </p>
          )}
        </div>
        {evento && (
          <button type="button" onClick={instalar} className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-black text-black active:scale-95">
            Instalar
          </button>
        )}
        <button type="button" onClick={descartar} aria-label="Ahora no" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
