"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/app/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, EmptyState } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { TARIFAS, precioSuelto } from "@/lib/precios";
import { borrarPrecio, cambiarActivoPrecio, guardarPrecio, reordenarPrecios } from "./actions";

export type PrecioFila = { id: string; category: string; price: number; currency: string; description: string | null; is_active: boolean };

const MONEDAS = ["CUP", "USD", "MLC"];
const MAX_DETALLE = 600;

export default function PreciosEditor({ precios }: { precios: PrecioFila[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  // Copia local para cambios optimistas; se re-sincroniza cuando llegan datos nuevos del servidor.
  const [lista, setLista] = useState(precios);
  const [previa, setPrevia] = useState(precios);
  if (precios !== previa) {
    setPrevia(precios);
    setLista(precios);
  }

  const [agregando, setAgregando] = useState(false);
  const [aBorrar, setABorrar] = useState<PrecioFila | null>(null);
  const faltan = TARIFAS.filter((t) => !lista.some((p) => p.category === t.nombre));

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const alSoltar = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const antes = lista;
    const nueva = arrayMove(lista, lista.findIndex((p) => p.id === active.id), lista.findIndex((p) => p.id === over.id));
    setLista(nueva);
    startTransition(async () => {
      const r = await reordenarPrecios(nueva.map((p) => p.id));
      if (!r.ok) {
        setLista(antes);
        showToast(r.error, true, 5000);
      } else {
        showToast("Orden guardado", false, 1500);
        router.refresh();
      }
    });
  };

  const alternar = (p: PrecioFila, activo: boolean) => {
    setLista((l) => l.map((x) => (x.id === p.id ? { ...x, is_active: activo } : x)));
    startTransition(async () => {
      const r = await cambiarActivoPrecio(p.id, activo);
      if (!r.ok) {
        setLista((l) => l.map((x) => (x.id === p.id ? { ...x, is_active: !activo } : x)));
        showToast(r.error, true, 5000);
      } else {
        showToast(activo ? `${p.category}: visible` : `${p.category}: oculta`, false, 1500);
        router.refresh();
      }
    });
  };

  const borrar = (p: PrecioFila) =>
    startTransition(async () => {
      const r = await borrarPrecio(p.id);
      if (!r.ok) return showToast(r.error, true, 5000);
      setLista((l) => l.filter((x) => x.id !== p.id));
      showToast("Tarifa borrada", false);
      router.refresh();
    });

  return (
    <Card>
      <CardHeader
        titulo="Tarifas"
        descripcion="Cambia el precio y toca Guardar. Arrastra para cambiar el orden en la página de Precios."
        acciones={
          faltan.length > 0 && !agregando ? (
            <Button tamano="sm" onClick={() => setAgregando(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Agregar tarifa
            </Button>
          ) : null
        }
      />
      <div className="space-y-2 p-3 sm:p-5">
        {lista.length === 0 && !agregando ? (
          <EmptyState
            emoji="🏷️"
            titulo="Todavía no hay tarifas"
            texto="Sin tarifas, el sitio muestra «Precio a consultar» en cada título."
            accion={<Button onClick={() => setAgregando(true)}>Agregar la primera</Button>}
          />
        ) : (
          <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
            <SortableContext items={lista.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {lista.map((p) => (
                  <FilaPrecio key={p.id} precio={p} onAlternar={(v) => alternar(p, v)} onBorrar={() => setABorrar(p)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {agregando && (
          <NuevaTarifa
            opciones={faltan.map((t) => t.nombre)}
            onCerrado={(guardado) => {
              setAgregando(false);
              if (guardado) router.refresh();
            }}
          />
        )}
      </div>

      {aBorrar && (
        <ConfirmDialog
          titulo={`¿Borrar la tarifa de ${aBorrar.category}?`}
          texto={<>Los títulos de esta tarifa pasan a «Precio a consultar». Si solo quieres esconderla un tiempo, mejor apaga «Visible».</>}
          confirmar="Borrar"
          peligro
          onConfirmar={() => borrar(aBorrar)}
          onCerrado={() => setABorrar(null)}
        />
      )}
    </Card>
  );
}

function infoTarifa(nombre: string) {
  return TARIFAS.find((t) => t.nombre === nombre);
}

function FilaPrecio({ precio: p, onAlternar, onBorrar }: { precio: PrecioFila; onAlternar: (v: boolean) => void; onBorrar: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [guardando, startTransition] = useTransition();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });

  const inicial = { price: String(p.price), currency: p.currency, description: p.description ?? "" };
  const [borrador, setBorrador] = useState(inicial);
  const guardado = `${p.price}|${p.currency}|${p.description ?? ""}`;
  const [base, setBase] = useState(guardado);
  if (guardado !== base) {
    // Cambiaron los valores guardados (p. ej. tras Guardar): se descarta el borrador.
    setBase(guardado);
    setBorrador(inicial);
  }
  const [verDetalle, setVerDetalle] = useState(false);

  const t = infoTarifa(p.category);
  const cambiado = borrador.price !== inicial.price || borrador.currency !== inicial.currency || borrador.description !== inicial.description;
  const precioNum = Number(borrador.price.replace(",", "."));
  const valido = Number.isFinite(precioNum) && precioNum > 0;
  const comoLoVe = valido ? precioSuelto(p.category, [{ category: p.category, price: precioNum, currency: borrador.currency }]) : null;
  // El texto suele repetir el precio ("Una Película 50CUP…"): avisa si cambió el precio y el texto no.
  const textoViejo = valido && precioNum !== p.price && new RegExp(`(^|\\D)${p.price}(?!\\d)`).test(borrador.description);

  const guardar = () =>
    startTransition(async () => {
      const r = await guardarPrecio({ id: p.id, category: p.category, price: precioNum, currency: borrador.currency, description: borrador.description, is_active: p.is_active });
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast(`${p.category}: guardado`, false, 1500);
      router.refresh();
    });

  const idBase = `precio-${p.id}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border bg-white/[0.03] p-3 sm:p-4 ${isDragging ? "relative z-10 border-primary/60 shadow-2xl" : cambiado ? "border-primary/40" : "border-white/10"}`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Mover "${p.category}"`}
          className="-ml-1 flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-white">{p.category}</h3>
            {!p.is_active && <Badge tono="neutro">Oculta</Badge>}
            {cambiado && <Badge tono="aviso">Sin guardar</Badge>}
          </div>
          {t && t.cubre.length > 1 && <p className="mt-0.5 text-xs text-accent">También cobra: {t.cubre.filter((c) => c !== p.category).join(", ")}</p>}
        </div>

        <label className="flex shrink-0 items-center gap-2 pt-1.5 text-xs font-bold text-white/70">
          <span className="hidden sm:inline">Visible</span>
          <Switch activo={p.is_active} onChange={onAlternar} label={p.is_active ? `Ocultar ${p.category}` : `Mostrar ${p.category}`} />
        </label>
        <button type="button" onClick={onBorrar} aria-label={`Borrar la tarifa de ${p.category}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-offer/15 hover:text-red-300">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2 sm:pl-9">
        <div className="flex items-center gap-2">
          <label htmlFor={`${idBase}-precio`} className="sr-only">
            Precio de {p.category}
          </label>
          <Input
            id={`${idBase}-precio`}
            inputMode="decimal"
            value={borrador.price}
            onChange={(e) => setBorrador((b) => ({ ...b, price: e.target.value.replace(/[^\d.,]/g, "") }))}
            onKeyDown={(e) => e.key === "Enter" && cambiado && valido && guardar()}
            aria-invalid={!valido}
            className={`!w-24 text-right text-base font-black tabular-nums ${valido ? "" : "!border-offer/70"}`}
          />
          <label htmlFor={`${idBase}-moneda`} className="sr-only">
            Moneda
          </label>
          <div className="w-[92px]">
            <Select id={`${idBase}-moneda`} value={borrador.currency} onChange={(e) => setBorrador((b) => ({ ...b, currency: e.target.value }))}>
              {MONEDAS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </div>
          {t && <span className="whitespace-nowrap text-sm font-semibold text-white/70">{t.unidad}</span>}
        </div>
        <p className="min-w-0 pb-2.5 text-xs text-accent">
          {valido ? (
            <>
              El cliente ve: <span className="font-bold text-primary">{comoLoVe ?? `${precioNum} ${borrador.currency}`}</span>
            </>
          ) : (
            <span className="font-semibold text-red-300">Escribe un precio mayor que 0.</span>
          )}
        </p>
      </div>

      <div className="mt-2 sm:pl-9">
        <button
          type="button"
          onClick={() => setVerDetalle((v) => !v)}
          aria-expanded={verDetalle}
          aria-controls={`${idBase}-detalle`}
          className="inline-flex items-center gap-1 rounded-lg py-1 text-xs font-bold text-white/70 hover:text-white"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${verDetalle ? "rotate-180" : ""}`} aria-hidden="true" />
          Texto de la página de Precios
          {!verDetalle && !borrador.description && <span className="font-semibold text-accent">· vacío</span>}
        </button>
        {textoViejo && (
          <p className="mt-1 text-xs font-semibold text-amber-300">
            El texto todavía dice {p.price}. Revísalo antes de guardar.
          </p>
        )}
        {verDetalle && (
          <Field label="Detalle" htmlFor={`${idBase}-detalle`} contador={{ actual: borrador.description.length, max: MAX_DETALLE }} className="mt-2">
            <Textarea
              id={`${idBase}-detalle`}
              value={borrador.description}
              onChange={(e) => setBorrador((b) => ({ ...b, description: e.target.value }))}
              rows={4}
              placeholder="Ej.: Una temporada son de 12 a 20 capítulos."
            />
          </Field>
        )}
      </div>

      {cambiado && (
        <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-3">
          <Button variante="fantasma" tamano="sm" onClick={() => setBorrador(inicial)} disabled={guardando}>
            Deshacer
          </Button>
          <Button tamano="sm" onClick={guardar} disabled={guardando || !valido || borrador.description.length > MAX_DETALLE}>
            {guardando ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      )}
    </li>
  );
}

function NuevaTarifa({ opciones, onCerrado }: { opciones: string[]; onCerrado: (guardado: boolean) => void }) {
  const { showToast } = useToast();
  const [guardando, startTransition] = useTransition();
  const [categoria, setCategoria] = useState(opciones[0] ?? "");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("CUP");
  const precioNum = Number(precio.replace(",", "."));
  const valido = !!categoria && Number.isFinite(precioNum) && precioNum > 0;
  const t = infoTarifa(categoria);

  const crear = () =>
    startTransition(async () => {
      const r = await guardarPrecio({ category: categoria, price: precioNum, currency: moneda, description: "", is_active: true });
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast(`Tarifa de ${categoria} creada`, false);
      onCerrado(true);
    });

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/[0.04] p-4">
      <p className="text-sm font-black text-white">Nueva tarifa</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Field label="Tarifa" htmlFor="nueva-tarifa" hint={t && t.cubre.length > 1 ? `Cobra: ${t.cubre.join(", ")}` : undefined}>
          <Select id="nueva-tarifa" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {opciones.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
        <Field label={`Precio${t ? ` (${t.unidad})` : ""}`} htmlFor="nueva-precio">
          <Input id="nueva-precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value.replace(/[^\d.,]/g, ""))} className="sm:!w-28" />
        </Field>
        <Field label="Moneda" htmlFor="nueva-moneda">
          <Select id="nueva-moneda" value={moneda} onChange={(e) => setMoneda(e.target.value)} className="sm:!w-24">
            {MONEDAS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variante="fantasma" tamano="sm" onClick={() => onCerrado(false)} disabled={guardando}>
          Cancelar
        </Button>
        <Button tamano="sm" onClick={crear} disabled={!valido || guardando}>
          {guardando ? "Creando…" : "Crear tarifa"}
        </Button>
      </div>
    </div>
  );
}
