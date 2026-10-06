import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ImageOff,
  Megaphone,
  Plus,
  Sparkles,
  Type,
} from "lucide-react";
import { createServerClient } from "@/utils/supabaseServer";
import { getAdmin } from "@/lib/adminAuth";
import { estadoVigencia, fechaCorta } from "@/components/admin/fechas";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Resumen" };
export const dynamic = "force-dynamic";

const DIA = 864e5;

type PromoResumen = { id: string; kind: "strip" | "card"; titulo: string; badge: string | null; desde: string; hasta: string | null; activa: boolean; prioridad: number };
type Aviso = { tono: "aviso" | "peligro"; Icono: typeof AlertTriangle; texto: string; href: string; accion: string };

export default async function ResumenPage() {
  const datos = await cargarResumen();
  return <Resumen {...datos} />;
}

// Lectura y cálculo fuera del render (la hora actual no es "pura" para React).
async function cargarResumen() {
  const sb = createServerClient();
  const ahora = Date.now();
  const haceUnaSemana = new Date(ahora - 7 * DIA).toISOString();
  const cuenta = { count: "exact" as const, head: true };

  const [admin, reco, estrenoAuto, promos, total, nuevos, estrenos, sinPoster, espIni, espFin, usuarios, votos, votosSemana] =
    await Promise.all([
      getAdmin(),
      sb.from("recomendacion").select("desde, hasta, media:media_id(title, poster_url, poster_thumb_url)").eq("activa", true).maybeSingle(),
      sb.from("media").select("title, poster_url, poster_thumb_url").eq("estreno", true).not("poster_url", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("promos").select("id,kind,titulo,badge,desde,hasta,activa,prioridad").order("prioridad", { ascending: false }),
      sb.from("media").select("id", cuenta),
      sb.from("media").select("id", cuenta).gte("created_at", haceUnaSemana),
      sb.from("media").select("id", cuenta).eq("estreno", true),
      sb.from("media").select("id", cuenta).is("poster_url", null),
      sb.from("media").select("id", cuenta).like("title", " %"),
      sb.from("media").select("id", cuenta).like("title", "% "),
      sb.from("profiles").select("id", cuenta),
      sb.from("ratings").select("id", cuenta),
      sb.from("ratings").select("id", cuenta).gte("created_at", haceUnaSemana),
    ]);

  // ── Lo que ve hoy el cliente ──
  const recoData = reco.data as unknown as { desde: string; hasta: string | null; media: { title: string; poster_url: string | null; poster_thumb_url: string | null } | null } | null;
  const recoVigencia = recoData ? estadoVigencia({ activa: true, desde: recoData.desde, hasta: recoData.hasta }, ahora) : null;
  const recoVisible = recoData?.media && recoVigencia === "activa" ? recoData.media : null;
  const destacadaAuto = estrenoAuto.data as { title: string; poster_url: string | null; poster_thumb_url: string | null } | null;

  const lista = (promos.data ?? []) as PromoResumen[];
  const conEstado = lista.map((p) => ({ ...p, estado: estadoVigencia(p, ahora) }));
  const activas = conEstado.filter((p) => p.estado === "activa");
  const franja = activas.find((p) => p.kind === "strip") ?? null;
  const tarjetas = activas.filter((p) => p.kind === "card");
  const programadas = conEstado.filter((p) => p.estado === "programada");

  // ── Para revisar ──
  const avisos: Aviso[] = [];
  if (!recoVisible) {
    avisos.push({
      tono: "aviso",
      Icono: Sparkles,
      texto: recoData && recoVigencia === "vencida" ? "La recomendada de la semana venció: el Inicio muestra la destacada automática." : "No elegiste recomendada de la semana: el Inicio muestra la destacada automática.",
      href: "/admin/portada",
      accion: "Elegir recomendada",
    });
  }
  for (const p of activas) {
    if (p.hasta && new Date(p.hasta).getTime() - ahora < 2 * DIA) {
      avisos.push({ tono: "aviso", Icono: CalendarClock, texto: `«${p.titulo}» termina el ${fechaCorta(p.hasta)}.`, href: "/admin/portada#promociones", accion: "Revisar promo" });
    }
  }
  const vencidasPublicadas = conEstado.filter((p) => p.activa && p.estado === "vencida");
  if (vencidasPublicadas.length) {
    avisos.push({
      tono: "aviso",
      Icono: CalendarClock,
      texto: `${vencidasPublicadas.length} ${vencidasPublicadas.length === 1 ? "promo vencida sigue publicada" : "promos vencidas siguen publicadas"} (ya no se ven en el sitio).`,
      href: "/admin/portada#promociones",
      accion: "Pausar o borrar",
    });
  }
  if (!activas.length) {
    avisos.push({ tono: "aviso", Icono: Megaphone, texto: "No hay ninguna promoción activa en el Inicio.", href: "/admin/portada#promociones", accion: "Crear promo" });
  }
  if ((sinPoster.count ?? 0) > 0) {
    avisos.push({ tono: "peligro", Icono: ImageOff, texto: `${sinPoster.count} ${sinPoster.count === 1 ? "título no tiene" : "títulos no tienen"} póster.`, href: "/admin/media", accion: "Ir al catálogo" });
  }
  // Mismo criterio que el aviso del Catálogo: espacio al inicio o al final.
  const conEspacios = (espIni.count ?? 0) + (espFin.count ?? 0);
  if (conEspacios > 0) {
    avisos.push({
      tono: "aviso",
      Icono: Type,
      texto: `${conEspacios} ${conEspacios === 1 ? "título tiene" : "títulos tienen"} espacios de más al inicio o al final (salen desordenados en A–Z).`,
      href: "/admin/media",
      accion: "Corregir en el catálogo",
    });
  }

  const indicadores = [
    { label: "Títulos en el catálogo", valor: total.count ?? 0, detalle: `${estrenos.count ?? 0} marcados como estreno` },
    { label: "Nuevos esta semana", valor: nuevos.count ?? 0, detalle: "Agregados en los últimos 7 días" },
    { label: "Usuarios registrados", valor: usuarios.count ?? 0, detalle: "Cuentas creadas en el sitio" },
    { label: "Votos", valor: votos.count ?? 0, detalle: `${votosSemana.count ?? 0} en los últimos 7 días` },
  ];

  return { nombre: admin?.nombre ?? "admin", recoVisible, recoHasta: recoData?.hasta ?? null, destacadaAuto, franja, tarjetas, programadas: programadas.length, avisos, indicadores };
}

function Resumen({
  nombre,
  recoVisible,
  recoHasta,
  destacadaAuto,
  franja,
  tarjetas,
  programadas,
  avisos,
  indicadores,
}: Awaited<ReturnType<typeof cargarResumen>>) {
  return (
    <>
      <PageHeader
        titulo={`Hola, ${nombre} 👋`}
        descripcion="Así está hoy tu sitio y lo que conviene revisar."
        acciones={
          <ButtonLink href="/" target="_blank" variante="secundario" tamano="sm">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver sitio
          </ButtonLink>
        }
      />

      {/* ── Accesos rápidos ── */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <ButtonLink href="/admin/portada" variante="secundario" className="justify-start">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> Cambiar recomendada
        </ButtonLink>
        <ButtonLink href="/admin/portada#promociones" variante="secundario" className="justify-start">
          <Megaphone className="h-4 w-4 text-primary" aria-hidden="true" /> Nueva promo
        </ButtonLink>
        <ButtonLink href="/admin/media/new" variante="secundario" className="col-span-2 justify-start sm:col-span-1">
          <Plus className="h-4 w-4 text-primary" aria-hidden="true" /> Agregar título
        </ButtonLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* ── Lo que ve hoy el cliente ── (min-w-0: los títulos largos no ensanchan la columna) */}
        <Card className="min-w-0">
          <CardHeader titulo="Lo que ve hoy el cliente" descripcion="El Inicio tal como está publicado ahora." />
          <div className="divide-y divide-white/5">
            <FilaPortada
              icono={<Sparkles className="h-4 w-4" aria-hidden="true" />}
              titulo="Recomendada de la semana"
              poster={(recoVisible ?? destacadaAuto)?.poster_thumb_url || (recoVisible ?? destacadaAuto)?.poster_url || null}
              valor={recoVisible ? recoVisible.title.trim() : destacadaAuto ? `${destacadaAuto.title.trim()} (automática)` : "—"}
              detalle={recoVisible ? (recoHasta ? `Hasta el ${fechaCorta(recoHasta)}` : "Sin fecha de fin") : "Elegida por el sitio: el estreno más reciente"}
              estado={recoVisible ? <Badge tono="exito">Elegida</Badge> : <Badge tono="neutro">Automática</Badge>}
            />
            <FilaPortada
              icono={<Megaphone className="h-4 w-4" aria-hidden="true" />}
              titulo="Franja de arriba"
              valor={franja ? franja.titulo : "Ninguna"}
              detalle={franja ? (franja.hasta ? `Hasta el ${fechaCorta(franja.hasta)}` : "Sin fecha de fin") : "No se muestra franja en el sitio"}
              estado={franja ? <Badge tono="exito">En el sitio</Badge> : <Badge tono="neutro">Vacía</Badge>}
            />
            <FilaPortada
              icono={<Megaphone className="h-4 w-4" aria-hidden="true" />}
              titulo="Ofertas y combos"
              valor={tarjetas.length ? `${tarjetas.length} ${tarjetas.length === 1 ? "tarjeta activa" : "tarjetas activas"}` : "Ninguna"}
              detalle={
                tarjetas.length
                  ? tarjetas.slice(0, 3).map((t) => `${t.badge ? `${t.badge} ` : ""}${t.titulo}`).join(" · ")
                  : "La sección no aparece en el Inicio"
              }
              estado={programadas ? <Badge tono="aviso">{programadas} programada{programadas === 1 ? "" : "s"}</Badge> : null}
            />
          </div>
          <div className="border-t border-white/10 px-5 py-3">
            <Link href="/admin/portada" className="text-sm font-bold text-primary underline-offset-4 hover:underline">
              Editar portada →
            </Link>
          </div>
        </Card>

        {/* ── Para revisar ── */}
        <Card className="min-w-0">
          <CardHeader titulo="Para revisar" descripcion={avisos.length ? `${avisos.length} ${avisos.length === 1 ? "cosa" : "cosas"}` : undefined} />
          {avisos.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-6 text-sm font-semibold text-whatsapp">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Todo en orden. No hay nada pendiente.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {avisos.map((a, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <a.Icono className={`mt-0.5 h-5 w-5 shrink-0 ${a.tono === "peligro" ? "text-red-300" : "text-amber-300"}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/85">{a.texto}</p>
                    <Link href={a.href} className="mt-1 inline-block text-xs font-bold text-primary underline-offset-4 hover:underline">
                      {a.accion} →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Indicadores ── */}
      <section aria-label="Indicadores" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indicadores.map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-surface p-4">
            <p className="text-xs font-bold text-accent">{k.label}</p>
            <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-white">{k.valor.toLocaleString("es")}</p>
            <p className="mt-1 text-xs text-white/50">{k.detalle}</p>
          </div>
        ))}
      </section>
    </>
  );
}

function FilaPortada({
  icono,
  titulo,
  valor,
  detalle,
  estado,
  poster,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  detalle: string;
  estado: React.ReactNode;
  poster?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" width={36} height={54} className="h-[54px] w-9 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icono}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-accent">{titulo}</p>
        <p className="truncate text-sm font-bold text-white">{valor}</p>
        <p className="truncate text-xs text-white/50">{detalle}</p>
      </div>
      {estado && <div className="shrink-0">{estado}</div>}
    </div>
  );
}
