"use client";

import { aItemPedido, usePedido } from "@/lib/pedido";

type MediaMin = Parameters<typeof aItemPedido>[0];

/**
 * Añade/quita un título de "Mi pedido".
 * - `icono`: botón redondo para superponer en la esquina de un póster.
 * - `boton`: botón con texto, para la recomendada y la ficha.
 */
export default function PedidoToggle({
  media,
  variante = "icono",
  className = "",
}: {
  media: MediaMin;
  variante?: "icono" | "boton";
  className?: string;
}) {
  const { tiene, agregar, quitar } = usePedido();
  const enPedido = tiene(media.id);
  const accion = () => (enPedido ? quitar(media.id) : agregar(aItemPedido(media)));
  const label = enPedido ? `Quitar ${media.title} de mi pedido` : `Añadir ${media.title} a mi pedido`;

  if (variante === "boton") {
    return (
      <button
        type="button"
        onClick={accion}
        aria-pressed={enPedido}
        aria-label={label}
        className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-sm font-bold transition active:scale-[0.97] ${
          enPedido
            ? "border-whatsapp/50 bg-whatsapp/15 text-whatsapp"
            : "border-white/15 text-white hover:-translate-y-0.5 hover:border-primary/50 hover:bg-white/5"
        } ${className}`}
      >
        <span aria-hidden="true" className="text-base leading-none">{enPedido ? "✓" : "＋"}</span>
        {enPedido ? "En tu pedido" : "Al pedido"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={accion}
      aria-pressed={enPedido}
      aria-label={label}
      title={enPedido ? "En tu pedido (toca para quitar)" : "Añadir a mi pedido"}
      className={`flex h-8 w-8 items-center justify-center rounded-full border text-base font-black shadow-lg backdrop-blur transition active:scale-90 ${
        enPedido
          ? "border-whatsapp bg-whatsapp text-black"
          : "border-white/25 bg-black/60 text-white hover:border-primary hover:bg-primary hover:text-black"
      } ${className}`}
    >
      <span aria-hidden="true" className="leading-none">{enPedido ? "✓" : "＋"}</span>
    </button>
  );
}
