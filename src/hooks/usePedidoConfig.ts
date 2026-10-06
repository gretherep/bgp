"use client";

import { useEffect, useState } from "react";
import type { PedidoConfig } from "@/lib/catalog";

// Tarifas, WhatsApp y promo de "Mi pedido": se piden una sola vez por visita
// (la respuesta además está cacheada en la CDN) y las comparten el panel y la ficha.
let cache: PedidoConfig | null = null;
let pendiente: Promise<PedidoConfig | null> | null = null;

function cargar(): Promise<PedidoConfig | null> {
  pendiente ??= fetch("/api/pedido-config")
    .then((r) => (r.ok ? (r.json() as Promise<PedidoConfig>) : null))
    .then((c) => (cache = c))
    .catch(() => null)
    .finally(() => {
      if (!cache) pendiente = null; // si falló, se reintenta la próxima vez
    });
  return pendiente;
}

/** `inicial`: la página ya la trae del servidor y no hace falta pedirla. */
export function usePedidoConfig(inicial?: PedidoConfig | null): PedidoConfig | null {
  const [config, setConfig] = useState<PedidoConfig | null>(inicial ?? cache);
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
