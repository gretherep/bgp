"use client";

import { useSyncExternalStore } from "react";

// "Mi pedido": lista de títulos guardada en el navegador del cliente (sin cuenta, sin servidor).
export type ItemPedido = {
  id: string;
  title: string;
  year: number;
  category: string;
  seasons: number | null;
  poster_url: string | null;
};

const KEY = "bgp:pedido";
const VACIO: ItemPedido[] = [];
const listeners = new Set<() => void>();
let cache: ItemPedido[] | null = null;

function leer(): ItemPedido[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(raw) ? (raw as ItemPedido[]) : VACIO;
  } catch {
    cache = VACIO;
  }
  return cache;
}

function escribir(items: ItemPedido[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

function suscribir(cb: () => void) {
  listeners.add(cb);
  // Otra pestaña modificó el pedido: invalidar la copia en memoria.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const EVENTO_PEDIDO = "bgp:pedido-agregado";

export function usePedido() {
  const items = useSyncExternalStore(suscribir, leer, () => VACIO);
  return {
    items,
    tiene: (id: string) => items.some((i) => i.id === id),
    // Siempre sobre la lista guardada (leer()), no sobre `items` del render: con dos toques
    // seguidos, el segundo botón todavía tiene la lista vieja y pisaría al primero.
    agregar: (item: ItemPedido) => {
      const actual = leer();
      if (actual.some((i) => i.id === item.id)) return;
      escribir([...actual, item]);
      window.dispatchEvent(new CustomEvent(EVENTO_PEDIDO, { detail: item }));
    },
    quitar: (id: string) => escribir(leer().filter((i) => i.id !== id)),
    vaciar: () => escribir(VACIO),
  };
}

export function aItemPedido(m: {
  id: string;
  title: string;
  year: number;
  category: string;
  seasons?: number | null;
  poster_url?: string | null;
  poster_thumb_url?: string | null;
}): ItemPedido {
  return {
    id: m.id,
    title: m.title.trim(),
    year: m.year,
    category: m.category,
    seasons: m.seasons ? Number(m.seasons) : null,
    // En el panel se ve a 40 px: basta la miniatura de 320 px (~14 KB) en vez del original (~100 KB).
    poster_url: m.poster_thumb_url || m.poster_url || null,
  };
}
