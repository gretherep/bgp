"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, GripVertical, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/app/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, EmptyState } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Switch } from "@/components/ui/Switch";
import { estadoVigencia, fechaCorta, type EstadoVigencia } from "@/components/admin/fechas";
import { borrarPromo, cambiarActivaPromo, reordenarPromos } from "./actions";
import PromoForm, { type PromoBorrador } from "./PromoForm";

export type PromoFila = {
  id: string;
  kind: "strip" | "card";
  titulo: string;
  subtitulo: string | null;
  badge: string | null;
  cta_label: string | null;
  cta_mensaje: string | null;
  min_items: number | null;
  desde: string;
  hasta: string | null;
  prioridad: number;
  activa: boolean;
};

const ESTADO: Record<EstadoVigencia, { label: string; tono: "exito" | "aviso" | "neutro" | "peligro" }> = {
  activa: { label: "Activa", tono: "exito" },
  programada: { label: "Programada", tono: "aviso" },
  vencida: { label: "Vencida", tono: "peligro" },
  pausada: { label: "Pausada", tono: "neutro" },
};

export default function PromosEditor({ promos, whatsappUrl }: { promos: PromoFila[]; whatsappUrl: string | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  // Copia local para cambios optimistas; se re-sincroniza cuando llegan datos nuevos del servidor.
  const [lista, setLista] = useState(promos);
  const [previa, setPrevia] = useState(promos);
  if (promos !== previa) {
    setPrevia(promos);
    setLista(promos);
  }

  const [editando, setEditando] = useState<PromoBorrador | null>(null);
  const [aBorrar, setABorrar] = useState<PromoFila | null>(null);

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
      const r = await reordenarPromos(nueva.map((p) => p.id));
      if (!r.ok) {
        setLista(antes);
        showToast(r.error, true, 5000);
      } else {
        showToast("Orden guardado", false, 1500);
        router.refresh();
      }
    });
  };

  const alternar = (p: PromoFila, activa: boolean) => {
    setLista((l) => l.map((x) => (x.id === p.id ? { ...x, activa } : x)));
    startTransition(async () => {
      const r = await cambiarActivaPromo(p.id, activa);
      if (!r.ok) {
        setLista((l) => l.map((x) => (x.id === p.id ? { ...x, activa: !activa } : x)));
        showToast(r.error, true, 5000);
      } else {
        showToast(activa ? "Promo activada" : "Promo pausada", false, 1500);
        router.refresh();
      }
    });
  };

  const borrar = (p: PromoFila) =>
    startTransition(async () => {
      const r = await borrarPromo(p.id);
      if (!r.ok) return showToast(r.error, true, 5000);
      setLista((l) => l.filter((x) => x.id !== p.id));
      showToast("Promo borrada", false);
      router.refresh();
    });

  const franjaVisible = lista.find((p) => p.kind === "strip" && estadoVigencia(p) === "activa");

  return (
    <Card id="promociones">
      <CardHeader
        titulo={
          <span className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" aria-hidden="true" /> Promociones
          </span>
        }
        descripcion="Arrastra para cambiar el orden: la de arriba sale primero. De las franjas solo se muestra la primera activa."
        acciones={
          <Button tamano="sm" onClick={() => setEditando({})}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Nueva promo
          </Button>
        }
      />

      <div className="p-5">
        {lista.length === 0 ? (
          <EmptyState
            emoji="📣"
            titulo="Todavía no hay promociones"
            texto="Crea una franja para arriba de todo el sitio o tarjetas de oferta para el Inicio. Hay plantillas para empezar rápido."
            accion={
              <Button onClick={() => setEditando({})}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Crear la primera
              </Button>
            }
          />
        ) : (
          <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={alSoltar}>
            <SortableContext items={lista.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {lista.map((p) => (
                  <FilaPromo
                    key={p.id}
                    promo={p}
                    visibleComoFranja={franjaVisible?.id === p.id}
                    onAlternar={(v) => alternar(p, v)}
                    onEditar={() => setEditando(p)}
                    onDuplicar={() => {
                      const { id: _id, ...copia } = p;
                      void _id;
                      setEditando({ ...copia, titulo: `${p.titulo} (copia)`, activa: false });
                    }}
                    onBorrar={() => setABorrar(p)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {editando && (
        <PromoForm
          inicial={editando}
          whatsappUrl={whatsappUrl}
          onCerrado={(guardado) => {
            setEditando(null);
            if (guardado) router.refresh();
          }}
        />
      )}

      {aBorrar && (
        <ConfirmDialog
          titulo="¿Borrar esta promo?"
          texto={<>«{aBorrar.titulo}» desaparece del sitio. Si solo quieres ocultarla un tiempo, mejor páusala.</>}
          confirmar="Borrar"
          peligro
          onConfirmar={() => borrar(aBorrar)}
          onCerrado={() => setABorrar(null)}
        />
      )}
    </Card>
  );
}

function FilaPromo({
  promo: p,
  visibleComoFranja,
  onAlternar,
  onEditar,
  onDuplicar,
  onBorrar,
}: {
  promo: PromoFila;
  visibleComoFranja: boolean;
  onAlternar: (v: boolean) => void;
  onEditar: () => void;
  onDuplicar: () => void;
  onBorrar: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const estado = ESTADO[estadoVigencia(p)];
  const vigencia = p.hasta ? `Hasta el ${fechaCorta(p.hasta)}` : "Sin fecha de fin";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border bg-white/[0.03] p-2.5 sm:gap-3 sm:p-3 ${isDragging ? "z-10 border-primary/60 shadow-2xl" : "border-white/10"}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Mover "${p.titulo}"`}
        className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tono={estado.tono}>{estado.label}</Badge>
          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">
            {p.kind === "strip" ? "Franja" : "Tarjeta"}
          </span>
          {p.kind === "strip" && visibleComoFranja && <span className="text-[11px] font-bold text-whatsapp">● En el sitio</span>}
          {p.min_items && <span className="text-[11px] font-semibold text-accent">Mín. {p.min_items} títulos</span>}
        </div>
        <p className="mt-1 truncate text-sm font-bold text-white">
          {p.badge && <span className="mr-1.5 rounded bg-offer px-1 py-px text-[10px] font-black uppercase text-white">{p.badge}</span>}
          {p.titulo}
        </p>
        <p className="truncate text-xs text-accent">{vigencia}</p>
      </div>

      <Switch activo={p.activa} onChange={onAlternar} label={p.activa ? `Pausar "${p.titulo}"` : `Activar "${p.titulo}"`} />
      <div className="flex shrink-0 items-center">
        <button type="button" onClick={onEditar} aria-label={`Editar "${p.titulo}"`} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={onDuplicar} aria-label={`Duplicar "${p.titulo}"`} className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white sm:flex">
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={onBorrar} aria-label={`Borrar "${p.titulo}"`} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-offer/15 hover:text-red-300">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
