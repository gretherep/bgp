"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ImagePlus, MessageCircle, Store } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { guardarNegocio, subirLogo } from "./actions";
import { LIMITES_NEGOCIO } from "./limites";

export type NegocioEditable = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  whatsapp_url: string | null;
  horario: string | null; // null: falta ejecutar el SQL 002
};

type Borrador = { title: string; description: string; image_url: string | null; telefono: string; horario: string };

/** "https://wa.me/5350623401" → "50623401" */
function telefonoDe(url: string | null): string {
  const d = (url ?? "").replace(/\D/g, "");
  return d.length === 10 && d.startsWith("53") ? d.slice(2) : d;
}

const telefonoValido = (t: string) => /^5\d{7}$/.test(t.replace(/\D/g, "").replace(/^53(?=\d{8}$)/, ""));

async function comprimirLogo(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  try {
    return await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 512, useWebWorker: true, fileType: "image/webp", initialQuality: 0.85 });
  } catch {
    return file; // el servidor rechaza si pesa demasiado
  }
}

export default function NegocioForm({ inicial }: { inicial: NegocioEditable }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [guardando, startTransition] = useTransition();
  const [subiendo, setSubiendo] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  const base: Borrador = {
    title: inicial.title,
    description: inicial.description,
    image_url: inicial.image_url,
    telefono: telefonoDe(inicial.whatsapp_url),
    horario: inicial.horario ?? "",
  };
  const [b, setB] = useState(base);
  // Tras guardar llegan datos nuevos del servidor: el borrador vuelve a coincidir con lo guardado.
  const clave = JSON.stringify(inicial);
  const [previa, setPrevia] = useState(clave);
  if (clave !== previa) {
    setPrevia(clave);
    setB(base);
  }

  const cambiado = JSON.stringify(b) !== JSON.stringify(base);
  const telOk = telefonoValido(b.telefono);
  const sinColumnaHorario = inicial.horario === null;
  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setB((x) => ({ ...x, [k]: v }));

  const elegirLogo = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return showToast("Elige una imagen (PNG, JPG o WebP).", true);
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("file", await comprimirLogo(f));
      const r = await subirLogo(fd);
      if (!r.ok) return showToast(r.error, true, 5000);
      set("image_url", r.data!.url);
    } finally {
      setSubiendo(false);
      if (archivo.current) archivo.current.value = "";
    }
  };

  const guardar = () =>
    startTransition(async () => {
      const r = await guardarNegocio({
        id: inicial.id,
        title: b.title,
        description: b.description,
        image_url: b.image_url,
        telefono: b.telefono,
        horario: sinColumnaHorario ? null : b.horario,
      });
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast("Datos del negocio guardados", false);
      router.refresh();
    });

  const telLimpio = b.telefono.replace(/\D/g, "").replace(/^53(?=\d{8}$)/, "");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader
            titulo={
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-whatsapp" aria-hidden="true" /> Contacto y horario
              </span>
            }
            descripcion="Todos los botones «Pedir» del sitio abren tu WhatsApp con el mensaje ya escrito."
          />
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field
              label="Número de WhatsApp"
              htmlFor="neg-tel"
              error={b.telefono && !telOk ? "Debe ser un móvil cubano de 8 dígitos (empieza por 5)." : null}
              hint={
                telOk ? (
                  <a href={`https://wa.me/53${telLimpio}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-whatsapp hover:underline">
                    Probar el enlace <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : (
                  "Sin el +53."
                )
              }
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/50">+53</span>
                <Input id="neg-tel" type="tel" inputMode="numeric" autoComplete="off" value={b.telefono} onChange={(e) => set("telefono", e.target.value)} className="pl-12 font-bold tabular-nums tracking-wide" placeholder="50623401" />
              </div>
            </Field>

            <Field
              label="Horario"
              htmlFor="neg-horario"
              contador={sinColumnaHorario ? undefined : { actual: b.horario.length, max: LIMITES_NEGOCIO.horario }}
              hint={sinColumnaHorario ? undefined : "Sale en el Inicio, debajo de los botones. Vacío: no se muestra."}
            >
              <Input
                id="neg-horario"
                value={sinColumnaHorario ? "" : b.horario}
                onChange={(e) => set("horario", e.target.value)}
                disabled={sinColumnaHorario}
                placeholder={sinColumnaHorario ? "Falta un paso en la base de datos" : "Lunes a viernes de 9am a 6pm"}
              />
              {sinColumnaHorario && (
                <p className="mt-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                  Para editarlo aquí hay que ejecutar <code className="font-mono">docs/sql/002_fase_a_negocio.sql</code> en Supabase. Mientras tanto se toma de la línea «HORARIO…» de la descripción.
                </p>
              )}
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader
            titulo={
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" aria-hidden="true" /> Página de Precios
              </span>
            }
            descripcion="Lo que se lee en «Precios»: quiénes son, zonas, turnos y precio del paquete."
          />
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                {b.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.image_url} alt="Logo actual" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-white/40" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-white/90">Logo</p>
                <p className="text-xs text-accent">Se comprime solo (máx. 512 px).</p>
                <div className="mt-2 flex gap-2">
                  <Button variante="secundario" tamano="sm" onClick={() => archivo.current?.click()} disabled={subiendo}>
                    {subiendo ? "Subiendo…" : b.image_url ? "Cambiar logo" : "Subir logo"}
                  </Button>
                  {b.image_url !== base.image_url && (
                    <Button variante="fantasma" tamano="sm" onClick={() => set("image_url", base.image_url)}>
                      Volver al anterior
                    </Button>
                  )}
                </div>
                <input ref={archivo} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => elegirLogo(e.target.files?.[0])} />
              </div>
            </div>

            <Field label="Título" htmlFor="neg-titulo" contador={{ actual: b.title.length, max: LIMITES_NEGOCIO.titulo }}>
              <Input id="neg-titulo" value={b.title} onChange={(e) => set("title", e.target.value)} placeholder="Tu dosis semanal de entretenimiento" />
            </Field>

            <Field
              label="Descripción"
              htmlFor="neg-desc"
              contador={{ actual: b.description.length, max: LIMITES_NEGOCIO.descripcion }}
              hint="Los saltos de línea se respetan. Deja una línea en blanco entre párrafos."
            >
              <Textarea id="neg-desc" value={b.description} onChange={(e) => set("description", e.target.value)} rows={14} />
            </Field>
          </div>
        </Card>
      </div>

      {/* Vista previa: lo que cambia en el sitio */}
      <aside className="min-w-0 xl:sticky xl:top-8 xl:self-start">
        <Card>
          <CardHeader titulo="Así se ve en el Inicio" />
          <div className="p-5">
            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-bold text-black">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Pedir el paquete
            </span>
            <p className="mt-1.5 text-[11px] text-accent">Abre {telOk ? `+53 ${telLimpio.slice(0, 4)} ${telLimpio.slice(4)}` : "—"}</p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-accent">
              <li>🛵 Servicio a domicilio</li>
              {!sinColumnaHorario && b.horario.trim() && (
                <li>🕘 {b.horario.trim()}</li>
              )}
              <li>💬 Respuesta por WhatsApp</li>
            </ul>
          </div>
        </Card>
      </aside>

      {cambiado && (
        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-2 rounded-2xl border border-primary/40 bg-surface/95 px-3 py-3 shadow-2xl backdrop-blur-md sm:px-4 lg:bottom-4 xl:col-span-2">
          <Badge tono="aviso">
            <span className="hidden sm:inline">Cambios&nbsp;</span>sin guardar
          </Badge>
          <div className="flex gap-2">
            <Button variante="fantasma" tamano="sm" onClick={() => setB(base)} disabled={guardando}>
              Deshacer
            </Button>
            <Button tamano="sm" onClick={guardar} disabled={guardando || subiendo || !telOk}>
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
