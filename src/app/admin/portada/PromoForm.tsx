"use client";

import { useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import type { Promo } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";
import { useHojaModal } from "@/hooks/useHojaModal";
import { useToast } from "@/app/context/ToastContext";
import PromoStrip from "@/components/home/PromoStrip";
import { OfertaCard } from "@/components/home/OffersRow";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { campoAIso, domingoCampo, hoyCampo, isoACampo } from "@/components/admin/fechas";
import { guardarPromo } from "./actions";
import type { PromoFila } from "./PromosEditor";

export type PromoBorrador = Partial<PromoFila>;

type Estado = {
  kind: "strip" | "card";
  badge: string;
  titulo: string;
  subtitulo: string;
  cta_label: string;
  cta_mensaje: string;
  min_items: string;
  desde: string;
  hasta: string;
  activa: boolean;
};

// Puntos de partida editables. Los precios son los del negocio a la fecha; ajústalos al usarlas.
const PLANTILLAS: { nombre: string; datos: Partial<Estado> }[] = [
  {
    nombre: "📦 Paquete de la semana",
    datos: { kind: "strip", badge: "Nuevo", titulo: `📦 Paquete de esta semana: ${SITE.paqueteTamano} por 500 CUP`, subtitulo: "Lunes a viernes de 9am a 6pm", cta_label: "Reservar turno", cta_mensaje: "Hola 👋 quiero reservar turno para el paquete de esta semana" },
  },
  {
    nombre: "🏷️ Descuento",
    datos: { kind: "card", badge: "-20%", titulo: "5 películas por 200 CUP", subtitulo: "Para clientes fijos del paquete", cta_label: "Lo quiero", cta_mensaje: "Hola 👋 me interesa la promo de 5 películas por 200 CUP", min_items: "5" },
  },
  {
    nombre: "🎁 Combo",
    datos: { kind: "card", badge: "Combo", titulo: "Paquete + 1 temporada", subtitulo: "Elige cualquier serie o anime del catálogo", cta_label: "Armar combo", cta_mensaje: "Hola 👋 quiero el combo paquete + 1 temporada" },
  },
  {
    nombre: "✌️ 2x1",
    datos: { kind: "card", badge: "2x1", titulo: "2x1 en temporadas de series", subtitulo: "Solo esta semana", cta_label: "Aprovechar", cta_mensaje: "Hola 👋 me interesa el 2x1 en series" },
  },
  {
    nombre: "🔎 A pedido",
    datos: { kind: "card", badge: "A pedido", titulo: "¿No está en el catálogo? Te lo buscamos", subtitulo: "Dinos el nombre y te confirmamos si se puede conseguir", cta_label: "Pedir título", cta_mensaje: "Hola 👋 busco un título que no está en el catálogo:", min_items: "" },
  },
];

function desdeBorrador(b: PromoBorrador): Estado {
  const nueva = !b.id && !b.titulo;
  return {
    kind: b.kind ?? "card",
    badge: b.badge ?? "",
    titulo: b.titulo ?? "",
    subtitulo: b.subtitulo ?? "",
    cta_label: b.cta_label ?? "",
    cta_mensaje: b.cta_mensaje ?? "",
    min_items: b.min_items ? String(b.min_items) : "",
    desde: b.desde ? isoACampo(b.desde) : hoyCampo(),
    hasta: b.hasta ? isoACampo(b.hasta) : nueva ? domingoCampo() : "",
    activa: b.activa ?? true,
  };
}

export default function PromoForm({
  inicial,
  whatsappUrl,
  onCerrado,
}: {
  inicial: PromoBorrador;
  whatsappUrl: string | null;
  onCerrado: (guardado: boolean) => void;
}) {
  const { showToast } = useToast();
  const [pendiente, startTransition] = useTransition();
  const [f, setF] = useState<Estado>(() => desdeBorrador(inicial));
  const guardado = useRef(false);
  const cerrar = useHojaModal(() => onCerrado(guardado.current));
  const editando = !!inicial.id;

  const set = <K extends keyof Estado>(k: K, v: Estado[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const previa: Promo = {
    id: "vista-previa",
    kind: f.kind,
    titulo: f.titulo || "Título de la promo",
    subtitulo: f.subtitulo || null,
    badge: f.badge || null,
    cta_label: f.cta_label || null,
    cta_mensaje: f.cta_mensaje || null,
    min_items: f.min_items ? Number(f.min_items) : null,
    hasta: campoAIso(f.hasta, true),
  };

  const guardar = () =>
    startTransition(async () => {
      const r = await guardarPromo({
        id: inicial.id,
        kind: f.kind,
        titulo: f.titulo,
        subtitulo: f.subtitulo,
        badge: f.badge,
        cta_label: f.cta_label,
        cta_mensaje: f.cta_mensaje,
        min_items: f.min_items ? Number(f.min_items) : null,
        desde: campoAIso(f.desde) ?? new Date().toISOString(),
        hasta: campoAIso(f.hasta, true),
        activa: f.activa,
      });
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast(editando ? "✅ Promo actualizada" : "✅ Promo creada", false);
      guardado.current = true;
      cerrar();
    });

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-label={editando ? "Editar promo" : "Nueva promo"}>
      <button type="button" aria-label="Cerrar sin guardar" onClick={cerrar} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative flex max-h-[92vh] w-full animate-fade-up flex-col rounded-t-3xl border border-b-0 border-white/10 bg-surface [animation-duration:220ms] sm:h-full sm:max-h-none sm:max-w-xl sm:rounded-none sm:rounded-l-3xl sm:border-b sm:border-r-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">{editando ? "Editar promo" : "Nueva promo"}</h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
          {!editando && (
            <div>
              <p className="mb-2 text-[13px] font-bold text-white/90">Empezar desde una plantilla</p>
              <div className="flex flex-wrap gap-1.5">
                {PLANTILLAS.map((t) => (
                  <button key={t.nombre} type="button" onClick={() => setF((prev) => ({ ...prev, ...t.datos }))} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white/80 transition hover:border-primary/50 hover:text-primary">
                    {t.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field label="¿Dónde se muestra?">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { v: "strip", t: "Franja de arriba", d: "Una línea bajo el menú, en todo el sitio" },
                  { v: "card", t: "Tarjeta de oferta", d: "En «Ofertas y combos» del Inicio" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={f.kind === o.v}
                  onClick={() => set("kind", o.v)}
                  className={`rounded-xl border p-3 text-left transition ${f.kind === o.v ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/25"}`}
                >
                  {/* Dibujo mínimo de la ubicación */}
                  <span className="mb-2 block h-10 overflow-hidden rounded-md border border-white/10 bg-background p-1">
                    {o.v === "strip" ? (
                      <>
                        <span className="block h-1.5 rounded-sm bg-white/20" />
                        <span className="mt-0.5 block h-1.5 rounded-sm bg-primary/70" />
                        <span className="mt-1 block h-3 rounded-sm bg-white/10" />
                      </>
                    ) : (
                      <span className="grid h-full grid-cols-3 gap-0.5">
                        <span className="rounded-sm bg-primary/70" />
                        <span className="rounded-sm bg-white/15" />
                        <span className="rounded-sm bg-white/15" />
                      </span>
                    )}
                  </span>
                  <span className="block text-sm font-bold text-white">{o.t}</span>
                  <span className="block text-[11px] text-accent">{o.d}</span>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <Field label="Etiqueta" htmlFor="p-badge" hint="Ej.: -20%, 2x1">
              <Input id="p-badge" value={f.badge} maxLength={14} onChange={(e) => set("badge", e.target.value)} placeholder="-20%" />
            </Field>
            <Field label="Título" htmlFor="p-titulo" contador={{ actual: f.titulo.length, max: 90 }}>
              <Input id="p-titulo" value={f.titulo} maxLength={90} onChange={(e) => set("titulo", e.target.value)} placeholder="5 películas por 200 CUP" />
            </Field>
          </div>

          <Field label="Detalle (opcional)" htmlFor="p-sub" contador={{ actual: f.subtitulo.length, max: 140 }}>
            <Input id="p-sub" value={f.subtitulo} maxLength={140} onChange={(e) => set("subtitulo", e.target.value)} placeholder="Para clientes fijos del paquete" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <Field label="Texto del botón" htmlFor="p-cta">
              <Input id="p-cta" value={f.cta_label} maxLength={24} onChange={(e) => set("cta_label", e.target.value)} placeholder="Lo quiero" />
            </Field>
            <Field label="Mensaje que llega a tu WhatsApp" htmlFor="p-msg" hint="Lo que el cliente te envía al tocar el botón.">
              <Textarea id="p-msg" value={f.cta_mensaje} maxLength={300} rows={2} onChange={(e) => set("cta_mensaje", e.target.value)} placeholder="Hola 👋 me interesa la promo…" className="min-h-[72px]" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde" htmlFor="p-desde">
              <Input id="p-desde" type="date" value={f.desde} onChange={(e) => set("desde", e.target.value)} />
            </Field>
            <Field label="Hasta" htmlFor="p-hasta" hint="Vacío: sin fin. Con fecha, se ve la cuenta regresiva.">
              <Input id="p-hasta" type="date" value={f.hasta} min={f.desde} onChange={(e) => set("hasta", e.target.value)} />
            </Field>
          </div>

          <Field label="Mínimo de títulos (opcional)" htmlFor="p-min" hint="Activa la barra «Te faltan N títulos para la promo» en Mi pedido. Cuenta todos los títulos del pedido.">
            <Input id="p-min" type="number" inputMode="numeric" min={1} max={999} value={f.min_items} onChange={(e) => set("min_items", e.target.value)} placeholder="Ej.: 5" className="max-w-[8rem]" />
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">Publicada</p>
              <p className="text-xs text-accent">Apágala para guardarla sin mostrarla.</p>
            </div>
            <Switch activo={f.activa} onChange={(v) => set("activa", v)} label="Publicada" />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-accent">Vista previa</p>
            {f.kind === "strip" ? (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <PromoStrip promo={previa} href={waLink(whatsappUrl, previa.cta_mensaje ?? "")} />
              </div>
            ) : (
              <div className="max-w-sm">
                <OfertaCard promo={previa} whatsappUrl={whatsappUrl} />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variante="secundario" onClick={cerrar} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={pendiente || f.titulo.trim().length < 3} className="flex-1">
            {pendiente ? "Guardando…" : editando ? "Guardar cambios" : "Crear promo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
