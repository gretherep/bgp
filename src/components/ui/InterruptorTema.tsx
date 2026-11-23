"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { aplicarTema, suscribirTema, temaOscuroActivo } from "@/lib/tema";

// Cápsula con sol y luna; la perilla se desliza al lado del tema activo y muestra su ícono.
// La posición sale de la clase "dark" (CSS), así se ve bien desde el primer pintado, sin esperar a React.
export default function InterruptorTema({ className = "" }: { className?: string }) {
  const oscuro = useSyncExternalStore(suscribirTema, temaOscuroActivo, () => true);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      aria-label="Modo oscuro"
      title={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => aplicarTema(!temaOscuroActivo())}
      className={`tema-switch group relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full border border-ink/10 bg-ink/[0.07] transition-colors duration-300 hover:border-ink/20 active:scale-95 ${className}`}
    >
      {/* Íconos del fondo: queda a la vista el del tema al que se puede cambiar */}
      <Sun className="absolute left-[9px] h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
      <Moon className="absolute right-[9px] h-3.5 w-3.5 text-ink/35" aria-hidden="true" />

      {/* Perilla */}
      <span
        aria-hidden="true"
        className="absolute left-[3px] top-[3px] grid h-6 w-6 place-items-center rounded-full bg-surface-2 shadow-[0_2px_6px_rgba(0,0,0,0.25)] ring-1 ring-ink/5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:translate-x-7 dark:bg-brand"
      >
        <Sun className="col-start-1 row-start-1 h-3.5 w-3.5 text-amber-500 transition-all duration-300 dark:rotate-90 dark:scale-0 dark:opacity-0" />
        <Moon className="col-start-1 row-start-1 h-3.5 w-3.5 -rotate-90 scale-0 text-white opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100" />
      </span>
    </button>
  );
}
