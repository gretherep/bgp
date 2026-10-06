"use client";

import { useEffect, useState } from "react";
import type { PedidoConfig } from "@/lib/catalog";
import { usePedido } from "@/lib/pedido";
import { precioItem } from "@/lib/precios";
import { waLink } from "@/lib/whatsapp";
import { useHojaModal } from "@/hooks/useHojaModal";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

// La configuración (tarifas, WhatsApp, promo) se pide una sola vez por visita.
let configCache: PedidoConfig | null = null;

/** Hoja inferior en móvil, panel lateral derecho desde sm. */
export default function PedidoPanel({ onCerrado }: { onCerrado: () => void }) {
  const cerrar = useHojaModal(onCerrado);
  const { items, quitar, vaciar } = usePedido();
  const [config, setConfig] = useState<PedidoConfig | null>(configCache);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);

  useEffect(() => {
    if (configCache) return;
    fetch("/api/pedido-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c: PedidoConfig | null) => {
        if (c) {
          configCache = c;
          setConfig(c);
        }
      })
      .catch(() => {});
  }, []);

  const precios = config?.precios ?? [];
  const lineas = items.map((it) => ({ it, precio: precioItem(it.category, it.seasons, precios) }));
  const total = lineas.reduce((s, l) => s + (l.precio.monto ?? 0), 0);
  const moneda = lineas.find((l) => l.precio.moneda)?.precio.moneda ?? "CUP";
  const hayPorCapitulo = lineas.some((l) => l.precio.monto === null);
  const promo = config?.promo ?? null;
  const faltan = promo ? Math.max(promo.min_items - items.length, 0) : 0;

  const lista = ["Hola 👋 quiero estos títulos:", ...items.map((it, i) => `${i + 1}. *${it.title}* (${it.year}) – ${it.category}`)];
  const resumen = [
    total > 0 && `Total aproximado: ${total.toLocaleString("es")} ${moneda}${hayPorCapitulo ? " + novelas/realities por capítulo" : ""}`,
    promo && faltan === 0 && `Promo: ${promo.titulo}`,
  ].filter(Boolean) as string[];
  const mensaje = [...lista, ...(resumen.length ? ["", ...resumen] : [])].join("\n");

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-label="Mi pedido">
      <button type="button" aria-label="Cerrar pedido" onClick={cerrar} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative flex max-h-[88vh] w-full animate-fade-up flex-col rounded-t-3xl border border-b-0 border-white/10 bg-surface [animation-duration:220ms] sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl sm:border-b sm:border-r-0">
        <span className="mx-auto mt-3 block h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden="true" />

        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-3 sm:pt-6">
          <h2 className="text-lg font-black text-white">
            🛍️ Mi pedido <span className="text-accent">({items.length})</span>
          </h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Progreso hacia la promo */}
        {promo && items.length > 0 && (
          <div className="mx-5 mb-3 rounded-2xl border border-primary/25 bg-primary/10 p-3">
            <p className="text-[13px] font-bold text-white">
              {faltan > 0 ? (
                <>Te {faltan === 1 ? "falta" : "faltan"} <span className="text-primary">{faltan} {faltan === 1 ? "título" : "títulos"}</span> para la promo</>
              ) : (
                <>🎉 ¡Ya tienes la promo!</>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/60">
              {promo.badge && <span className="mr-1 font-black text-primary">{promo.badge}</span>}
              {promo.titulo}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={promo.min_items} aria-valuenow={Math.min(items.length, promo.min_items)}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(items.length / promo.min_items, 1) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto overscroll-contain border-t border-white/10">
          {items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-3xl" aria-hidden="true">🛍️</p>
              <p className="mt-2 font-bold text-white">Tu pedido está vacío</p>
              <p className="mt-1 text-sm text-accent">Toca ＋ en cualquier título para añadirlo y luego envíanos la lista por WhatsApp.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {lineas.map(({ it, precio }) => (
                <li key={it.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-[60px] w-10 shrink-0 overflow-hidden rounded-md bg-surface-2 ring-1 ring-white/10">
                    {it.poster_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.poster_url} alt="" width={40} height={60} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{it.title}</p>
                    <p className="truncate text-xs text-accent">{it.year} · {it.category}</p>
                    <p className="text-xs font-semibold text-primary">{config ? precio.texto : "…"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitar(it.id)}
                    aria-label={`Quitar ${it.title}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Total y envío */}
        {items.length > 0 && (
          <div className="border-t border-white/10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-white/70">Total aproximado</span>
              <span className="text-xl font-black text-white">
                {config ? `${total.toLocaleString("es")} ${moneda}` : "…"}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-accent">
              Precio de cliente fijo{hayPorCapitulo ? "; novelas y realities se cobran por capítulo" : ""}. Te confirmamos el total por WhatsApp.
            </p>

            <a
              href={waLink(config?.whatsappUrl ?? null, mensaje)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp py-3.5 text-sm font-black text-black shadow-lg shadow-whatsapp/25 transition hover:brightness-110 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" />
              Enviar pedido por WhatsApp
            </a>

            <div className="mt-3 text-center">
              {confirmarVaciar ? (
                <span className="text-xs text-white/70">
                  ¿Vaciar el pedido?{" "}
                  <button type="button" onClick={() => { vaciar(); setConfirmarVaciar(false); }} className="font-bold text-red-300 underline underline-offset-4">Sí, vaciar</button>
                  {" · "}
                  <button type="button" onClick={() => setConfirmarVaciar(false)} className="font-bold text-white underline underline-offset-4">No</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmarVaciar(true)} className="text-xs font-semibold text-white/50 underline-offset-4 hover:text-white hover:underline">
                  Vaciar pedido
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
