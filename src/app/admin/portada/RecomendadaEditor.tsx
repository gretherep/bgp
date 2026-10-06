"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, X } from "lucide-react";
import type { HomeMedia } from "@/lib/catalog";
import type { Precio } from "@/lib/precios";
import { razonesSugeridas } from "@/lib/format";
import { SITE } from "@/lib/site";
import { useToast } from "@/app/context/ToastContext";
import RecomendadaCard from "@/components/home/RecomendadaCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, EmptyState } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { campoAIso, domingoCampo, estadoVigencia, fechaCorta, hoyCampo, isoACampo } from "@/components/admin/fechas";
import { buscarTitulos, publicarRecomendacion, quitarRecomendacion } from "./actions";

export type RecomendacionGuardada = {
  id: string;
  frase: string;
  razones: string[] | null;
  activa: boolean;
  desde: string;
  hasta: string | null;
  created_at: string;
  media: HomeMedia;
};

const FRASE_IDEAL = 140;
const FRASE_MAX = 200;

export default function RecomendadaEditor({
  preseleccion,
  activa,
  historial,
  precios,
  whatsappUrl,
}: {
  /** Título elegido desde el Catálogo ("⭐ Recomendar esta semana"): el formulario empieza con él. */
  preseleccion: HomeMedia | null;
  activa: RecomendacionGuardada | null;
  historial: RecomendacionGuardada[];
  precios: Precio[];
  whatsappUrl: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendiente, startTransition] = useTransition();

  // Con preselección se empieza de cero con ese título; si no, se editan los datos publicados.
  const base = preseleccion ? null : activa;
  const [media, setMedia] = useState<HomeMedia | null>(preseleccion ?? activa?.media ?? null);
  const [frase, setFrase] = useState(base?.frase ?? "");
  const [razones, setRazones] = useState<string[]>(() => [...(base?.razones ?? []), "", "", ""].slice(0, 3));
  const [desde, setDesde] = useState(base ? isoACampo(base.desde) : hoyCampo());
  const [hasta, setHasta] = useState(base ? isoACampo(base.hasta) : domingoCampo());

  useEffect(() => {
    if (preseleccion) document.getElementById("frase")?.focus();
  }, [preseleccion]);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);

  const vigencia = activa ? estadoVigencia({ activa: true, desde: activa.desde, hasta: activa.hasta }) : null;
  const sugerencias = media ? razonesSugeridas(media, SITE.paqueteTamano).filter((s) => !razones.includes(s)) : [];
  const razonesLlenas = razones.map((r) => r.trim()).filter(Boolean);

  const usarSugerencia = (s: string) => {
    const i = razones.findIndex((r) => !r.trim());
    if (i === -1) return showToast("Ya tienes 3 razones: borra una para usar esta.", true);
    setRazones((prev) => prev.map((r, j) => (j === i ? s : r)));
  };

  const reutilizar = (r: RecomendacionGuardada) => {
    setMedia(r.media);
    setFrase(r.frase);
    setRazones([...(r.razones ?? []), "", "", ""].slice(0, 3));
    setDesde(hoyCampo());
    setHasta(domingoCampo());
    showToast(`Cargada "${r.media.title.trim()}". Revisa y publica.`, false);
    document.getElementById("editor-recomendada")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const publicar = () =>
    startTransition(async () => {
      const r = await publicarRecomendacion({
        media_id: media?.id ?? "",
        frase,
        razones: razonesLlenas,
        desde: campoAIso(desde) ?? new Date().toISOString(),
        hasta: campoAIso(hasta, true),
      });
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast("✅ Recomendada publicada en el Inicio", false);
      router.refresh();
    });

  const quitar = () =>
    startTransition(async () => {
      const r = await quitarRecomendacion();
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast("Recomendada quitada: el Inicio vuelve a la destacada automática", false);
      router.refresh();
    });

  return (
    <Card>
      <CardHeader
        titulo={
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Recomendada de la semana
          </span>
        }
        descripcion={
          activa ? (
            <>
              <span className="font-semibold text-white/80">{activa.media.title.trim()}</span>
              {activa.hasta ? ` · hasta el ${fechaCorta(activa.hasta)}` : " · sin fecha de fin"}
            </>
          ) : (
            "Sin elegir: el Inicio muestra automáticamente el estreno más reciente."
          )
        }
        acciones={
          activa ? (
            <Badge tono={vigencia === "activa" ? "exito" : vigencia === "programada" ? "aviso" : "peligro"}>
              {vigencia === "activa" ? "Publicada" : vigencia === "programada" ? `Desde el ${fechaCorta(activa.desde)}` : "Vencida"}
            </Badge>
          ) : (
            <Badge tono="neutro">Automática</Badge>
          )
        }
      />

      <div id="editor-recomendada" className="grid scroll-mt-20 gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* ── Formulario ── (min-w-0: sin esto, un título largo en una línea ensancha la columna) */}
        <div className="min-w-0 space-y-5">
          <Field label="1. Título" hint={media ? undefined : "Busca por nombre. Sin escribir nada verás lo último que entró."}>
            {media ? (
              <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 p-2.5">
                {media.poster_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.poster_url} alt="" width={36} height={54} className="h-[54px] w-9 rounded-md object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{media.title.trim()}</p>
                  <p className="text-xs text-accent">{media.year} · {media.category}</p>
                </div>
                <Button variante="fantasma" tamano="sm" onClick={() => setMedia(null)} aria-label="Cambiar título">
                  Cambiar
                </Button>
              </div>
            ) : (
              <BuscadorTitulos onElegir={setMedia} />
            )}
          </Field>

          <Field
            label="2. Frase gancho"
            htmlFor="frase"
            contador={{ actual: frase.length, max: FRASE_IDEAL }}
            hint="Lo que diría un amigo para convencerte. Ej.: «Si te gustó La Casa de Papel, esta no la vas a poder soltar»."
            error={frase.length > FRASE_MAX ? `Máximo ${FRASE_MAX} caracteres.` : null}
          >
            <Textarea id="frase" value={frase} onChange={(e) => setFrase(e.target.value)} maxLength={FRASE_MAX} rows={3} placeholder="Escribe por qué tienen que verla…" />
          </Field>

          <Field label="3. Tres razones para verla" hint="Cortas y concretas. Toca una sugerencia para usarla.">
            <div className="space-y-2">
              {razones.map((r, i) => (
                <div key={i} className="relative">
                  <Input
                    value={r}
                    maxLength={70}
                    onChange={(e) => setRazones((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={`Razón ${i + 1}`}
                    aria-label={`Razón ${i + 1}`}
                    className="pr-10"
                  />
                  {r && (
                    <button type="button" onClick={() => setRazones((prev) => prev.map((x, j) => (j === i ? "" : x)))} aria-label={`Borrar razón ${i + 1}`} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {sugerencias.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {sugerencias.map((s) => (
                  <button key={s} type="button" onClick={() => usarSugerencia(s)} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/75 transition hover:border-primary/50 hover:text-primary">
                    ＋ {s}
                  </button>
                ))}
              </div>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="4. Se ve desde" htmlFor="reco-desde">
              <Input id="reco-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </Field>
            <Field label="Hasta" htmlFor="reco-hasta" hint="Vacío: hasta que la cambies.">
              <Input id="reco-hasta" type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-5">
            <Button onClick={publicar} disabled={pendiente || !media || frase.trim().length < 10}>
              {pendiente ? "Publicando…" : activa ? "Publicar cambios" : "Publicar en el Inicio"}
            </Button>
            {activa && (
              <Button variante="peligro" onClick={() => setConfirmarQuitar(true)} disabled={pendiente}>
                Quitar recomendada
              </Button>
            )}
          </div>
        </div>

        {/* ── Vista previa ── */}
        <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-accent">Vista previa en el Inicio</p>
          {media ? (
            <RecomendadaCard
              reco={{ media, frase: frase.trim(), razones: razonesLlenas, elegida: true }}
              whatsappUrl={whatsappUrl}
              precios={precios}
            />
          ) : (
            <EmptyState emoji="⭐" titulo="Elige un título" texto="Aquí verás cómo queda la tarjeta en el Inicio mientras escribes." />
          )}
        </div>
      </div>

      {historial.length > 0 && (
        <div className="border-t border-white/10 px-5 py-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-accent">Recomendadas anteriores</p>
          <ul className="divide-y divide-white/5">
            {historial.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                {r.media.poster_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.media.poster_url} alt="" width={28} height={42} loading="lazy" className="h-[42px] w-7 rounded object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white/90">{r.media.title.trim()}</p>
                  <p className="truncate text-xs text-accent">“{r.frase}” · {fechaCorta(r.created_at)}</p>
                </div>
                <Button variante="secundario" tamano="sm" onClick={() => reutilizar(r)}>
                  Reutilizar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmarQuitar && (
        <ConfirmDialog
          titulo="¿Quitar la recomendada?"
          texto="El Inicio volverá a mostrar automáticamente el estreno más reciente."
          confirmar="Quitar"
          peligro
          onConfirmar={quitar}
          onCerrado={() => setConfirmarQuitar(false)}
        />
      )}
    </Card>
  );
}

function BuscadorTitulos({ onElegir }: { onElegir: (m: HomeMedia) => void }) {
  const [q, setQ] = useState("");
  const [activo, setActivo] = useState(false);
  const [resultados, setResultados] = useState<HomeMedia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    const t = setTimeout(async () => {
      // Vaciar mientras busca: así no se elige por error un resultado de la búsqueda anterior.
      setResultados(null);
      setCargando(true);
      const r = await buscarTitulos(q);
      if (!vigente) return;
      setError(r.ok ? null : r.error);
      setResultados(r.ok ? (r.data ?? []) : null);
      setCargando(false);
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [q, activo]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
        <Input
          type="search"
          value={q}
          onFocus={() => setActivo(true)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar título…"
          aria-label="Buscar título para recomendar"
          className="pl-9"
        />
      </div>
      {activo && (
        <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-surface-2/60" aria-busy={cargando}>
          {cargando && !resultados && <li className="px-3 py-3 text-sm text-accent">Buscando…</li>}
          {error && <li className="px-3 py-3 text-sm font-semibold text-red-300">{error}</li>}
          {resultados?.length === 0 && <li className="px-3 py-3 text-sm text-accent">No hay títulos con ese nombre.</li>}
          {resultados?.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => onElegir(m)} className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/[0.06]">
                {m.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.poster_url} alt="" width={28} height={42} loading="lazy" className="h-[42px] w-7 rounded object-cover" />
                ) : (
                  <span className="h-[42px] w-7 rounded bg-white/10" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">{m.title.trim()}</span>
                  <span className="block text-xs text-accent">
                    {m.year} · {m.category}
                    {m.estreno && <span className="ml-1.5 font-bold text-red-300">· Estreno</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
