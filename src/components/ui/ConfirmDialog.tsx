"use client";

import { useRef } from "react";
import { useHojaModal } from "@/hooks/useHojaModal";
import { Button } from "./Button";

/** Confirmación para acciones destructivas. "Atrás" y Esc cancelan. Montarlo solo mientras está abierto. */
export function ConfirmDialog({
  titulo,
  texto,
  confirmar = "Confirmar",
  peligro = false,
  onConfirmar,
  onCerrado,
}: {
  titulo: string;
  texto?: React.ReactNode;
  confirmar?: string;
  peligro?: boolean;
  onConfirmar: () => void;
  onCerrado: () => void;
}) {
  const accion = useRef(false);
  const cerrar = useHojaModal(() => {
    onCerrado();
    if (accion.current) onConfirmar();
  });

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="Cancelar" onClick={cerrar} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm animate-fade-up rounded-2xl border border-white/10 bg-surface p-5 [animation-duration:180ms]">
        <h2 className="text-lg font-black text-white">{titulo}</h2>
        {texto && <p className="mt-1.5 text-sm text-white/70">{texto}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variante="secundario" onClick={cerrar}>
            Cancelar
          </Button>
          <Button
            variante={peligro ? "peligro" : "primario"}
            onClick={() => {
              accion.current = true;
              cerrar();
            }}
          >
            {confirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}
