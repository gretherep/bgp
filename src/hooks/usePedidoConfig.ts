"use client";

import { useEffect, useState } from "react";
import type { PedidoConfig } from "@/lib/catalog";

// Tarifas, WhatsApp y promo de "Mi pedido": se piden una sola vez por visita
// (la respuesta además está cacheada en la CDN) y las comparten el panel y la ficha.
// Dura 1 minuto: en una visita larga, un cambio de promo o de precio también llega.
const VIGENCIA_MS = 60_000;
let cache: PedidoConfig | null = null;
let cacheEn = 0;
let pendiente: Promise<PedidoConfig | null> | null = null;

const vigente = () => (cache && Date.now() - cacheEn < VIGENCIA_MS ? cache : null);

function cargar(): Promise<PedidoConfig | null> {
  if (vigente()) return Promise.resolve(cache);
  pendiente ??= fetch("/api/pedido-config")
    .then((r) => (r.ok ? (r.json() as Promise<PedidoConfig>) : null))
    .then((c) => {
      if (c) {
        cache = c;
        cacheEn = Date.now();
      }
      return c ?? cache; // sin red: la última conocida
    })
    .catch(() => cache)
    .finally(() => {
      pendiente = null;
    });
  return pendiente;
}

/** `inicial`: la página ya la trae del servidor y no hace falta pedirla. */
export function usePedidoConfig(inicial?: PedidoConfig | null): PedidoConfig | null {
  const [config, setConfig] = useState<PedidoConfig | null>(inicial ?? vigente());
  useEffect(() => {
    if (config) return;
    let vivo = true;
    cargar().then((c) => vivo && c && setConfig(c));
    return () => {
      vivo = false;
    };
  }, [config]);
  return config;
}
