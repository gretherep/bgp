import type { Metadata } from "next";
import Link from "next/link";
import { getPreciosPagina, type TarifaPublica } from "@/lib/catalog";
import { CATEGORIAS } from "@/lib/categories";
import { precioPaqueteDe, seccionesNegocio } from "@/lib/format";
import { TARIFAS } from "@/lib/precios";
import { SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import OffersRow from "@/components/home/OffersRow";

// Estática y regenerada cada 5 min (y al guardar Precios o Negocio en el panel).
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Precios",
  description: `Precios del Paquete Semanal de ${SITE.paqueteTamano} y de películas, series, anime, novelas y realities por separado. Servicio a domicilio; pedidos por WhatsApp.`,
  alternates: { canonical: "/descripcion" },
};

const fmt = (n: number) => n.toLocaleString("es");

/** Ejemplo de cuenta para que el precio se entienda de un vistazo ("3 temporadas = 300 CUP"). */
function ejemplo(t: TarifaPublica, modo: string | undefined): string | null {
  if (modo === "temporada") return `3 temporadas = ${fmt(t.price * 3)} ${t.currency}`;
  if (modo === "capitulo") return `20 capítulos = ${fmt(t.price * 20)} ${t.currency}`;
  if (modo === "unidad") return `5 películas = ${fmt(t.price * 5)} ${t.currency}`;
  return null;
}

export default async function PreciosPage() {
  const d = await getPreciosPagina();
  const precioPaquete = precioPaqueteDe(d.descripcion);
  // El precio y el horario del paquete ya salen en su tarjeta: no se repiten abajo.
  const secciones = seccionesNegocio(d.descripcion).filter((s) => !/^(precio del paquete|horario)/i.test(s.titulo ?? ""));
  const intro = secciones.filter((s) => !s.titulo);
  const detalles = secciones.filter((s) => s.titulo);

  return (
    <>
      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: "radial-gradient(60% 90% at 15% 0%, rgba(249,195,164,0.12), transparent 70%)" }}
        />
        <div className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
          <nav aria-label="Ruta" className="mb-3 text-xs font-semibold text-accent">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span aria-hidden="true" className="mx-1.5 text-white/30">›</span>
            <span className="text-white/80">Precios</span>
          </nav>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            <span aria-hidden="true" className="mr-2">💰</span>Precios
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Lo que cuesta cada cosa, sin sorpresas. Pide por WhatsApp y te lo llevamos a domicilio.
          </p>
        </div>
      </section>

      {/* ── Paquete semanal + tarifas ────────────────────────────────── */}
      <section className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-6 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-6">
          {/* Paquete semanal: el producto principal */}
          {/* En PC acompaña al bajar por las tarifas (sticky) en vez de estirarse hasta su altura */}
          <article className="relative isolate flex flex-col overflow-hidden rounded-3xl border border-primary/40 bg-surface p-6 sm:p-8 lg:sticky lg:top-24 lg:self-start">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{ backgroundImage: "radial-gradient(80% 70% at 100% 0%, rgba(249,195,164,0.18), transparent 70%)" }}
            />
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black">
              📦 Lo más pedido
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">Paquete semanal</h2>
            <p className="mt-1 text-sm text-white/70">{SITE.paqueteTamano} de estrenos, series, novelas y más, cada semana.</p>
            <p className="mt-5 flex items-baseline gap-2">
              {precioPaquete ? (
                <>
                  <span className="text-5xl font-black tracking-tight text-white">{precioPaquete.split(" ")[0]}</span>
                  <span className="text-lg font-black text-primary">{precioPaquete.split(" ")[1]}</span>
                  <span className="text-sm font-semibold text-accent">el básico</span>
                </>
              ) : (
                <span className="text-2xl font-black text-white">Precio a consultar</span>
              )}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/80">
              <li className="flex gap-2"><span aria-hidden="true">🛵</span> Servicio a domicilio</li>
              {d.horario && <li className="flex gap-2"><span aria-hidden="true">🕘</span> {d.horario}</li>}
              <li className="flex gap-2"><span aria-hidden="true">🔁</span> Contenido nuevo cada semana</li>
            </ul>
            <a
              href={waLink(d.whatsappUrl, "Hola 👋 quiero reservar turno para el paquete de esta semana")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 py-3.5 text-sm font-black text-black transition hover:brightness-110 active:scale-[0.97]"
            >
              <WhatsAppIcon className="h-4 w-4" /> Reservar turno
            </a>
          </article>

          {/* Títulos sueltos */}
          <div className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">Títulos por separado</h2>
              <span className="text-xs font-semibold text-accent">Para grabar solo lo que quieras</span>
            </div>
            {d.tarifas.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-accent">
                Pregúntanos por WhatsApp el precio de lo que buscas.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {d.tarifas.map((t) => {
                  const info = TARIFAS.find((x) => x.nombre === t.category);
                  const cat = CATEGORIAS.find((c) => c.categorias.includes(t.category));
                  const tambien = info?.cubre.filter((c) => c !== t.category) ?? [];
                  const ej = ejemplo(t, info?.modo);
                  return (
                    <li key={t.category} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-primary/40">
                      <h3 className="text-base font-black text-white">
                        {cat && <span aria-hidden="true" className="mr-1.5">{cat.emoji}</span>}
                        {t.category}
                      </h3>
                      <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-3xl font-black tracking-tight text-white">{fmt(t.price)}</span>
                        <span className="text-sm font-black text-primary">{t.currency}</span>
                        {info && <span className="text-sm font-semibold text-accent">{info.unidad}</span>}
                      </p>
                      {ej && <p className="mt-1 text-xs font-semibold text-white/60">Ej.: {ej}</p>}
                      {tambien.length > 0 && <p className="mt-1 text-xs text-accent">También: {tambien.join(", ")}</p>}
                      {t.description && <p className="mt-3 whitespace-pre-line border-t border-white/10 pt-3 text-[13px] leading-relaxed text-white/70">{t.description.trim()}</p>}
                      {cat && (
                        <Link href={`/category/${cat.slug}`} className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-bold text-primary underline-offset-4 hover:underline">
                          Ver {cat.label.toLowerCase()} →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <OffersRow promos={d.promosCard} whatsappUrl={d.whatsappUrl} />

      {/* ── Cómo trabajamos (texto del panel → Negocio) ──────────────── */}
      {(intro.length > 0 || detalles.length > 0) && (
        <section className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-6 lg:px-10">
          <div className="grid gap-6 rounded-3xl border border-white/10 bg-surface p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-10">
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{d.titulo || "Quiénes somos"}</h2>
              {intro.map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">{p.texto}</p>
              ))}
            </div>
            {detalles.length > 0 && (
              <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                {detalles.map((s, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <dt className="text-[13px] font-black text-primary">{s.titulo}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-white/75">{s.texto}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>
      )}

      {/* ── Cierre ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-xl font-black text-white">¿Dudas con algún precio?</p>
            <p className="mt-1 text-sm text-accent">Escríbenos y te lo explicamos. También conseguimos títulos que no están en el catálogo.</p>
          </div>
          <a
            href={waLink(d.whatsappUrl, "Hola 👋 tengo una duda sobre los precios")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-whatsapp px-5 py-3 text-sm font-black text-black transition hover:brightness-110 active:scale-[0.97]"
          >
            <WhatsAppIcon className="h-4 w-4" /> Preguntar por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
