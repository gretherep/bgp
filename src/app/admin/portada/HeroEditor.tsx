"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import HeroTexto from "@/components/home/HeroTexto";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { HERO_CHIPS_DESTINO, HERO_LIMITES, HERO_ORIGINAL, type HeroTextos } from "@/lib/hero";
import { SITE } from "@/lib/site";
import { guardarHero } from "./actions";

const CHIPS: { clave: keyof HeroTextos["chips"]; etiqueta: string }[] = [
  { clave: "peliculas", etiqueta: "Botón 1" },
  { clave: "series", etiqueta: "Botón 2" },
  { clave: "top", etiqueta: "Botón 3" },
];

const igual = (a: HeroTextos, b: HeroTextos) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Texto de bienvenida del Inicio (titular, texto y los 3 botones). Lo que hace cada botón es fijo.
 * `disponible` = existe la columna business_info.hero (SQL 006).
 */
export default function HeroEditor({ guardado, disponible }: { guardado: HeroTextos; disponible: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendiente, startTransition] = useTransition();
  const [h, setH] = useState(guardado);
  const [previo, setPrevio] = useState(guardado);
  if (guardado !== previo) {
    setPrevio(guardado);
    setH(guardado);
  }

  const cambiado = !igual(h, guardado);
  const esOriginal = igual(guardado, HERO_ORIGINAL);
  const L = HERO_LIMITES;
  const set = (k: "titulo" | "destacado" | "subtexto", v: string) => setH((x) => ({ ...x, [k]: v }));
  const setChip = (k: keyof HeroTextos["chips"], v: string) => setH((x) => ({ ...x, chips: { ...x.chips, [k]: v } }));

  const guardar = (valor: HeroTextos | null, aviso: string) =>
    startTransition(async () => {
      const r = await guardarHero(valor);
      if (!r.ok) return showToast(r.error, true, 6000);
      showToast(aviso, false);
      router.refresh();
    });

  return (
    <Card id="bienvenida">
      <CardHeader
        titulo={
          <span className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" aria-hidden="true" /> Texto de bienvenida
          </span>
        }
        descripcion="Lo primero que se lee en el Inicio, arriba a la izquierda. Lo que hace cada botón no cambia: solo su texto."
        acciones={esOriginal ? <Badge>Texto original</Badge> : <Badge tono="marca">Personalizado</Badge>}
      />

      {!disponible && (
        <p className="mx-5 mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Para editarlo hay que ejecutar <code className="font-mono">docs/sql/006_texto_bienvenida.sql</code> en Supabase. Mientras tanto el Inicio muestra el texto original.
        </p>
      )}

      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <fieldset disabled={!disponible || pendiente} className="min-w-0 space-y-4 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titular" htmlFor="h-titulo" contador={{ actual: h.titulo.length, max: L.titulo }}>
              <Input id="h-titulo" value={h.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder={HERO_ORIGINAL.titulo} />
            </Field>
            <Field label="Segunda parte (en color)" htmlFor="h-destacado" contador={{ actual: h.destacado.length, max: L.destacado }} hint="Opcional.">
              <Input id="h-destacado" value={h.destacado} onChange={(e) => set("destacado", e.target.value)} placeholder={HERO_ORIGINAL.destacado} />
            </Field>
          </div>
          <Field label="Texto debajo del titular" htmlFor="h-subtexto" contador={{ actual: h.subtexto.length, max: L.subtexto }}>
            <Textarea id="h-subtexto" value={h.subtexto} onChange={(e) => set("subtexto", e.target.value)} rows={3} className="min-h-[84px]" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            {CHIPS.map((c) => (
              <Field key={c.clave} label={c.etiqueta} htmlFor={`h-chip-${c.clave}`} contador={{ actual: h.chips[c.clave].length, max: L.chip }} hint={HERO_CHIPS_DESTINO[c.clave]}>
                <Input id={`h-chip-${c.clave}`} value={h.chips[c.clave]} onChange={(e) => setChip(c.clave, e.target.value)} />
              </Field>
            ))}
          </div>
          <p className="text-xs text-accent">Consejo: empieza cada botón con un emoji (🍿 📺 🔥) para que se lea de un vistazo.</p>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
            {!esOriginal && (
              <Button variante="fantasma" tamano="sm" onClick={() => guardar(null, "El Inicio volvió al texto original")}>
                Volver al texto original
              </Button>
            )}
            {cambiado && (
              <Button variante="secundario" tamano="sm" onClick={() => setH(guardado)}>
                Deshacer
              </Button>
            )}
            <Button tamano="sm" onClick={() => guardar(h, "✅ Texto de bienvenida publicado")} disabled={!cambiado}>
              {pendiente ? "Guardando…" : "Publicar en el Inicio"}
            </Button>
          </div>
        </fieldset>

        {/* Vista previa con los mismos componentes del Inicio */}
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-accent">Así se ve en el Inicio</p>
          <div className="rounded-2xl border border-white/10 bg-background p-5" aria-hidden="true">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-primary">
              📦 Paquete de esta semana · {SITE.paqueteTamano}
            </span>
            <HeroTexto hero={{ titulo: h.titulo || HERO_ORIGINAL.titulo, destacado: h.destacado, subtexto: h.subtexto || HERO_ORIGINAL.subtexto }} Etiqueta="p" />
            <div className="mt-4 flex flex-wrap gap-2">
              {CHIPS.map((c) => (
                <span key={c.clave} className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] font-bold text-white/85">
                  {h.chips[c.clave] || HERO_ORIGINAL.chips[c.clave]}
                </span>
              ))}
            </div>
            <div className="mt-5 flex gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-whatsapp px-4 py-2.5 text-[13px] font-black text-black">
                <WhatsAppIcon className="h-4 w-4" /> Pedir el paquete
              </span>
              <span className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-bold text-white">Ver precios</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
