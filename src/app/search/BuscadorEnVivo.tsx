"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Campo de búsqueda de /search: mientras se escribe (pausa de 350 ms, mínimo 2 letras) actualiza
 * la URL y el servidor devuelve los resultados nuevos. Enter busca al instante.
 */
export default function BuscadorEnVivo({ inicial }: { inicial: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState(inicial);
  const [previo, setPrevio] = useState(inicial);
  if (inicial !== previo) {
    // Llegó otra búsqueda desde fuera (p. ej. el buscador del menú): el campo la refleja.
    setPrevio(inicial);
    if (inicial !== texto.trim()) setTexto(inicial);
  }
  const [pendiente, startTransition] = useTransition();
  const campo = useRef<HTMLInputElement>(null);

  const ir = (q: string) =>
    startTransition(() => router.replace(q ? `/search?query=${encodeURIComponent(q)}` : "/search", { scroll: false }));

  useEffect(() => {
    const q = texto.trim();
    if (q === inicial || (q.length > 0 && q.length < 2)) return;
    const t = setTimeout(() => ir(q), 350);
    return () => clearTimeout(t);
    // ir() se recalcula en cada render; solo debe reaccionar al texto escrito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  // Sin búsqueda: el cursor ya está en el campo (en el teléfono no abre el teclado solo: iOS lo ignora).
  useEffect(() => {
    if (!inicial) campo.current?.focus();
  }, [inicial]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        ir(texto.trim());
        campo.current?.blur(); // cierra el teclado del teléfono para ver los resultados
      }}
      className="relative"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" aria-hidden="true">
        <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35" />
      </svg>
      <input
        ref={campo}
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Película, serie, novela, anime…"
        aria-label="Buscar en el catálogo"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={80}
        className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.05] pl-12 pr-12 text-base text-white placeholder:text-white/40 transition focus:border-primary/60 focus:bg-white/[0.08] focus:outline-none"
      />
      {pendiente && (
        <span className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-primary" role="status" aria-label="Buscando" />
      )}
    </form>
  );
}
