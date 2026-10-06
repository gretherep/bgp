"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Link2, Sparkles, Trash2, X } from "lucide-react";
import { MEDIA_CATEGORIES } from "@/app/models/media-categories";
import { MEDIA_GENRES } from "@/app/models/media-genres";
import type { HomeMedia } from "@/lib/catalog";
import { useToast } from "@/app/context/ToastContext";
import PosterCard from "@/components/home/PosterCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { borrarTitulo, guardarTitulo, subirPoster } from "./actions";

export type TituloEditable = {
  id: string;
  title: string;
  synopsis: string | null;
  poster_url: string | null;
  genre: string | null;
  year: number;
  category: string;
  idioma: string | null;
  seasons: number | null;
  estreno: boolean | null;
};

const CON_TEMPORADAS = ["Series", "MiniSeries", "Series Animadas", "Anime", "Novelas", "Reality Shows"];
// Los valores que más se usan hoy en la base (texto libre).
const IDIOMAS = ["Latino", "Español", "Castellano", "Inglés-Subtitulado", "Subtitulado", "Dual-Audio", "Japonés-Subtitulado"];
const SINOPSIS_IDEAL = 400;

async function comprimir(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  try {
    return await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 900, useWebWorker: true, fileType: "image/webp", initialQuality: 0.8 });
  } catch {
    return file; // el servidor rechaza si pesa demasiado
  }
}

export default function MediaForm({ inicial, volver }: { inicial: TituloEditable | null; volver: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendiente, startTransition] = useTransition();
  const [paso, setPaso] = useState<string | null>(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);

  const [f, setF] = useState({
    title: inicial?.title ?? "",
    category: inicial?.category ?? "",
    year: String(inicial?.year ?? new Date().getFullYear()),
    idioma: inicial?.idioma ?? "",
    genre: inicial?.genre ?? "",
    seasons: inicial?.seasons ? String(inicial.seasons) : "",
    estreno: !!inicial?.estreno,
    synopsis: inicial?.synopsis ?? "",
    poster_url: inicial?.poster_url ?? "",
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previaArchivo, setPreviaArchivo] = useState<string | null>(null);
  const [modoUrl, setModoUrl] = useState(false);

  useEffect(() => () => {
    if (previaArchivo) URL.revokeObjectURL(previaArchivo);
  }, [previaArchivo]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const conTemporadas = CON_TEMPORADAS.includes(f.category);
  const editando = !!inicial;
  const posterVisible = previaArchivo ?? (f.poster_url || null);

  const elegirArchivo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Elige una imagen (JPG, PNG o WebP).", true);
    setArchivo(file);
    setPreviaArchivo(URL.createObjectURL(file));
    setModoUrl(false);
  };

  const quitarPoster = () => {
    setArchivo(null);
    setPreviaArchivo(null);
    set("poster_url", "");
  };

  const agregarGenero = (g: string) => {
    const actuales = f.genre.split(/\s*[-,/]\s*/).filter(Boolean);
    if (actuales.some((x) => x.toLowerCase() === g.toLowerCase())) return;
    set("genre", [...actuales, g].join("-"));
  };

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      let poster_url = f.poster_url;
      if (archivo) {
        setPaso("Comprimiendo póster…");
        const liviano = await comprimir(archivo);
        setPaso(`Subiendo póster (${Math.round(liviano.size / 1024)} KB)…`);
        const fd = new FormData();
        fd.append("file", liviano, liviano.name || "poster.webp");
        const subida = await subirPoster(fd);
        if (!subida.ok) {
          setPaso(null);
          return showToast(subida.error, true, 6000);
        }
        poster_url = subida.data!.url;
      }
      setPaso("Guardando…");
      const r = await guardarTitulo({
        id: inicial?.id,
        title: f.title,
        synopsis: f.synopsis,
        poster_url,
        genre: f.genre,
        year: Number(f.year),
        category: f.category,
        idioma: f.idioma,
        seasons: f.seasons ? Number(f.seasons) : null,
        estreno: f.estreno,
      });
      setPaso(null);
      if (!r.ok) return showToast(r.error, true, 6000);
      showToast(editando ? `✅ «${f.title.trim()}» actualizado` : `✅ «${f.title.trim()}» agregado al catálogo`, false);
      router.push(volver);
      router.refresh();
    });
  };

  const borrar = () =>
    startTransition(async () => {
      const r = await borrarTitulo(inicial!.id);
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast(`«${f.title.trim()}» se borró del catálogo`, false);
      router.push(volver);
      router.refresh();
    });

  // Vista previa con la misma tarjeta del catálogo público.
  const previa: HomeMedia = {
    id: inicial?.id ?? "nuevo",
    slug: "",
    title: f.title || "Título",
    synopsis: f.synopsis,
    poster_url: posterVisible,
    genre: f.genre as HomeMedia["genre"],
    year: Number(f.year) || new Date().getFullYear(),
    category: (f.category || "Películas") as HomeMedia["category"],
    estreno: f.estreno,
    idioma: f.idioma,
    seasons: f.seasons ? Number(f.seasons) : null,
    created_at: "",
    updated_at: "",
    rating_avg: 0,
    rating_count: 0,
  };

  return (
    <form onSubmit={guardar}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={volver} className="inline-flex items-center gap-1.5 text-sm font-bold text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al catálogo
        </Link>
        {editando && (
          <ButtonLink href={`/admin/portada?recomendar=${inicial.id}`} variante="secundario" tamano="sm">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Recomendar esta semana
          </ButtonLink>
        )}
      </div>

      <h1 className="mb-6 text-2xl font-black tracking-tight text-white sm:text-3xl">{editando ? "Editar título" : "Agregar título"}</h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-6">
          {/* ── Póster ── */}
          <Card>
            <CardHeader titulo="Póster" descripcion="Se comprime solo a WebP (≈ 200 KB) antes de subirlo, para que cargue rápido con datos móviles." />
            <div className="flex flex-wrap items-start gap-4 p-5">
              <div className="relative aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/[0.03]">
                {posterVisible ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={posterVisible} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={quitarPoster} aria-label="Quitar póster" className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-offer">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <span className="flex h-full items-center justify-center p-2 text-center text-[11px] text-white/40">Sin póster</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input ref={inputArchivo} type="file" accept="image/*" className="hidden" onChange={(e) => elegirArchivo(e.target.files?.[0])} />
                <Button variante="secundario" onClick={() => inputArchivo.current?.click()}>
                  <ImagePlus className="h-4 w-4" aria-hidden="true" /> {posterVisible ? "Cambiar imagen" : "Subir imagen"}
                </Button>
                {archivo && <p className="text-xs text-accent">Nueva imagen: {archivo.name} ({Math.round(archivo.size / 1024)} KB, se comprimirá al guardar)</p>}
                {modoUrl ? (
                  <Field label="URL de la imagen" htmlFor="poster-url" hint="Debe empezar con https://">
                    <Input id="poster-url" type="url" value={f.poster_url} onChange={(e) => { setArchivo(null); setPreviaArchivo(null); set("poster_url", e.target.value); }} placeholder="https://…" />
                  </Field>
                ) : (
                  <button type="button" onClick={() => setModoUrl(true)} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 underline-offset-4 hover:text-white hover:underline">
                    <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Usar una URL en su lugar
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* ── Datos ── */}
          <Card>
            <CardHeader titulo="Datos del título" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Título" htmlFor="m-title" className="sm:col-span-2">
                <Input id="m-title" value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={200} required placeholder="Ej.: Monster: The Lizzie Borden Story" />
              </Field>
              <Field label="Categoría" htmlFor="m-cat">
                <Select id="m-cat" value={f.category} onChange={(e) => set("category", e.target.value)} required>
                  <option value="" disabled>
                    Elegir…
                  </option>
                  {MEDIA_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Año" htmlFor="m-year">
                <Input id="m-year" type="number" inputMode="numeric" min={1900} max={new Date().getFullYear() + 1} value={f.year} onChange={(e) => set("year", e.target.value)} required />
              </Field>
              <Field label="Idioma" htmlFor="m-idioma" hint="Elige una opción o escribe otra.">
                <Input id="m-idioma" list="idiomas" value={f.idioma} onChange={(e) => set("idioma", e.target.value)} placeholder="Ej.: Latino" />
                <datalist id="idiomas">
                  {IDIOMAS.map((i) => (
                    <option key={i} value={i} />
                  ))}
                </datalist>
              </Field>
              {conTemporadas ? (
                <Field label="Temporadas" htmlFor="m-seasons">
                  <Input id="m-seasons" type="number" inputMode="numeric" min={1} max={99} value={f.seasons} onChange={(e) => set("seasons", e.target.value)} placeholder="Ej.: 3" />
                </Field>
              ) : (
                <div className="hidden sm:block" />
              )}
              <Field label="Géneros" htmlFor="m-genre" className="sm:col-span-2" hint="Separados con guion. Toca para agregar.">
                <Input id="m-genre" value={f.genre} onChange={(e) => set("genre", e.target.value)} required placeholder="Ej.: Terror-Drama" />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MEDIA_GENRES.map((g) => (
                    <button key={g} type="button" onClick={() => agregarGenero(g)} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/75 transition hover:border-primary/50 hover:text-primary">
                      ＋ {g}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-bold text-white">🔥 Estreno</p>
                  <p className="text-xs text-accent">Sale primero en el catálogo, con la cinta roja «Estreno».</p>
                </div>
                <Switch activo={f.estreno} onChange={(v) => set("estreno", v)} label="Marcar como estreno" />
              </div>
              <Field label="Sinopsis" htmlFor="m-syn" className="sm:col-span-2" contador={{ actual: f.synopsis.length, max: SINOPSIS_IDEAL }} hint="Dos o tres frases. Es lo que se lee en la ficha.">
                <Textarea id="m-syn" value={f.synopsis} onChange={(e) => set("synopsis", e.target.value)} rows={5} required maxLength={2000} />
              </Field>
            </div>
          </Card>

          {editando && (
            <Card className="border-offer/30">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-bold text-white">Borrar título</p>
                  <p className="text-xs text-accent">Desaparece del sitio junto con sus votos. No se puede deshacer.</p>
                </div>
                <Button variante="peligro" tamano="sm" onClick={() => setConfirmarBorrar(true)} disabled={pendiente}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Borrar
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* ── Vista previa + guardar ── */}
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-accent">Así se verá en el catálogo</p>
          {/* Solo imagen: la tarjeta real abriría la ficha o sumaría al pedido */}
          <div className="pointer-events-none mx-auto max-w-[11rem] select-none lg:max-w-none" aria-hidden="true">
            <PosterCard media={previa} />
          </div>
          <div className="mt-5 grid gap-2">
            <Button type="submit" disabled={pendiente}>
              {paso ?? (editando ? "Guardar cambios" : "Agregar al catálogo")}
            </Button>
            <ButtonLink href={volver} variante="secundario">
              Cancelar
            </ButtonLink>
          </div>
        </aside>
      </div>

      {confirmarBorrar && (
        <ConfirmDialog
          titulo="¿Borrar este título?"
          texto={<>«{f.title.trim()}» desaparece del sitio junto con sus votos. No se puede deshacer.</>}
          confirmar="Borrar"
          peligro
          onConfirmar={borrar}
          onCerrado={() => setConfirmarBorrar(false)}
        />
      )}
    </form>
  );
}
