"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Trash2, Type } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Select } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { borrarTitulo, cambiarEstreno, corregirEspaciosEnTitulos } from "./actions";

/** Búsqueda (con espera de 400 ms), categoría y "solo estrenos". El estado vive en la URL. */
export function FiltrosCatalogoAdmin({
  q,
  cat,
  soloEstrenos,
  categorias,
}: {
  q: string;
  cat: string | null;
  soloEstrenos: boolean;
  categorias: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [texto, setTexto] = useState(q);

  const ir = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const base = { q: texto.trim(), cat: cat ?? "", estreno: soloEstrenos ? "1" : "", ...cambios };
    Object.entries(base).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  useEffect(() => {
    if (texto.trim() === q) return;
    const t = setTimeout(() => ir({ q: texto.trim() }), 400);
    return () => clearTimeout(t);
    // ir() se recalcula en cada render; solo debe reaccionar al texto escrito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
        <Input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por título…" aria-label="Buscar por título" className="pl-9" />
      </div>
      <Select value={cat ?? ""} onChange={(e) => ir({ cat: e.target.value || null })} aria-label="Filtrar por categoría">
        <option value="">Todas las categorías</option>
        {categorias.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <button
        type="button"
        aria-pressed={soloEstrenos}
        onClick={() => ir({ estreno: soloEstrenos ? null : "1" })}
        className={`h-11 whitespace-nowrap rounded-xl border px-4 text-sm font-bold transition ${
          soloEstrenos ? "border-offer/50 bg-offer/15 text-red-200" : "border-white/10 bg-white/[0.04] text-white/75 hover:border-white/25"
        }`}
      >
        🔥 Solo estrenos
      </button>
    </div>
  );
}

export function EstrenoSwitch({ id, titulo, estreno }: { id: string; titulo: string; estreno: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [valor, setValor] = useState(estreno);
  const [previo, setPrevio] = useState(estreno);
  if (estreno !== previo) {
    setPrevio(estreno);
    setValor(estreno);
  }
  const [pendiente, startTransition] = useTransition();

  const cambiar = (v: boolean) => {
    setValor(v);
    startTransition(async () => {
      const r = await cambiarEstreno(id, v);
      if (!r.ok) {
        setValor(!v);
        return showToast(r.error, true, 5000);
      }
      showToast(v ? `🔥 «${titulo}» marcado como estreno` : `«${titulo}» ya no es estreno`, false, 1800);
      router.refresh();
    });
  };

  return (
    <label className="flex shrink-0 items-center gap-2" title="Estreno">
      <span className={`hidden text-[11px] font-bold uppercase tracking-wide sm:inline ${valor ? "text-red-300" : "text-white/40"}`}>Estreno</span>
      <Switch activo={valor} onChange={cambiar} disabled={pendiente} label={valor ? `Quitar estreno de ${titulo}` : `Marcar ${titulo} como estreno`} />
    </label>
  );
}

export function BorrarTitulo({ id, titulo }: { id: string; titulo: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirmar, setConfirmar] = useState(false);
  const [, startTransition] = useTransition();

  const borrar = () =>
    startTransition(async () => {
      const r = await borrarTitulo(id);
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast(`«${titulo}» se borró del catálogo`, false);
      router.refresh();
    });

  return (
    <>
      <button type="button" onClick={() => setConfirmar(true)} aria-label={`Borrar ${titulo}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-offer/15 hover:text-red-300">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
      {confirmar && (
        <ConfirmDialog
          titulo="¿Borrar este título?"
          texto={<>«{titulo}» desaparece del sitio junto con sus votos. No se puede deshacer.</>}
          confirmar="Borrar"
          peligro
          onConfirmar={borrar}
          onCerrado={() => setConfirmar(false)}
        />
      )}
    </>
  );
}

export function CorregirEspacios({ cantidad }: { cantidad: number }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendiente, startTransition] = useTransition();

  const corregir = () =>
    startTransition(async () => {
      const r = await corregirEspaciosEnTitulos();
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast(`✅ ${r.data?.corregidos ?? 0} títulos corregidos`, false);
      router.refresh();
    });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
      <Type className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm text-white/85">
        <strong>{cantidad} {cantidad === 1 ? "título tiene" : "títulos tienen"}</strong> espacios de más al inicio o al final (salen desordenados en A–Z).
      </p>
      <Button tamano="sm" onClick={corregir} disabled={pendiente}>
        {pendiente ? "Corrigiendo…" : "Corregir ahora"}
      </Button>
    </div>
  );
}
