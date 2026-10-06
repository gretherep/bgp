"use client";

import { useEffect, useState } from "react";
import { EVENTO_PEDIDO, usePedido, type ItemPedido } from "@/lib/pedido";
import PedidoPanel from "./PedidoPanel";

export const EVENTO_ABRIR_PEDIDO = "bgp:abrir-pedido";

/** Botón flotante "Mi pedido (n)" + aviso al añadir. Solo aparece si hay títulos en el pedido. */
export default function PedidoFlotante() {
  const { items } = usePedido();
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<{ titulo: string; n: number } | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onAgregado = (e: Event) => {
      const it = (e as CustomEvent<ItemPedido>).detail;
      setAviso((prev) => ({ titulo: it.title, n: (prev?.n ?? 0) + 1 }));
      clearTimeout(t);
      t = setTimeout(() => setAviso(null), 2600);
    };
    const onAbrir = () => setAbierto(true);
    window.addEventListener(EVENTO_PEDIDO, onAgregado);
    window.addEventListener(EVENTO_ABRIR_PEDIDO, onAbrir);
    return () => {
      clearTimeout(t);
      window.removeEventListener(EVENTO_PEDIDO, onAgregado);
      window.removeEventListener(EVENTO_ABRIR_PEDIDO, onAbrir);
    };
  }, []);

  return (
    <>
      {items.length > 0 && !abierto && (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[90] flex flex-col items-end gap-2 sm:right-6">
          {aviso && (
            <p role="status" className="max-w-[16rem] animate-fade-up truncate rounded-xl border border-white/10 bg-surface px-3 py-2 text-xs font-semibold text-white shadow-xl [animation-duration:200ms]">
              ✓ Añadido: <span className="text-primary">{aviso.titulo}</span>
            </p>
          )}
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label={`Abrir mi pedido, ${items.length} ${items.length === 1 ? "título" : "títulos"}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary py-3 pl-4 pr-3 text-sm font-black text-black shadow-[0_12px_30px_-8px_rgba(249,195,164,0.55)] transition hover:-translate-y-0.5 active:scale-95"
          >
            <span aria-hidden="true">🛍️</span>
            Mi pedido
            {/* key: el contador "salta" cada vez que cambia */}
            <span key={items.length} className="flex h-6 min-w-6 animate-fade-up items-center justify-center rounded-full bg-black px-1.5 text-xs font-black text-primary [animation-duration:250ms]">
              {items.length}
            </span>
          </button>
        </div>
      )}
      {abierto && <PedidoPanel onCerrado={() => setAbierto(false)} />}
    </>
  );
}
