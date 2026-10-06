"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Comportamiento común de hojas y paneles modales:
 * - entrada propia en el historial: el botón "atrás" (Android) cierra la hoja en vez de salir;
 * - Esc cierra;
 * - bloquea el scroll del fondo mientras está abierta.
 * `cerrar()` vuelve atrás en el historial; `onCerrado` se llama cuando la hoja ya se cerró.
 */
export function useHojaModal(onCerrado: () => void) {
  const ref = useRef(onCerrado);
  useEffect(() => {
    ref.current = onCerrado;
  });

  useEffect(() => {
    history.pushState({ bgpHoja: true }, "");
    const onPop = () => ref.current();
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && history.back();
    window.addEventListener("popstate", onPop);
    document.addEventListener("keydown", onEsc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = overflow;
    };
  }, []);

  return useCallback(() => history.back(), []);
}
