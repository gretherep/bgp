import Link from "next/link";
import type { HomeData } from "@/lib/catalog";
import { rangoSemanaActual } from "@/lib/format";
import { SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import AtajosHero from "./AtajosHero";
import HeroTexto from "./HeroTexto";
import NuevosRail from "./NuevosRail";
import RecomendadaCard from "./RecomendadaCard";

export default function HomeHero({ data }: { data: HomeData }) {
  const { nuevos, nuevosSonDeLaSemana, recomendada, whatsappUrl, horario, hero } = data;
  const pedirPaquete = waLink(whatsappUrl, `Hola 👋 quiero el paquete de esta semana (${SITE.paqueteTamano})`);

  return (
    <section className="relative isolate overflow-hidden">
      {/* Fondo: solo degradados CSS (0 KB, sin JS) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(60% 55% at 12% 0%, rgba(249,195,164,0.16), transparent 70%), radial-gradient(45% 50% at 95% 15%, rgba(99,102,241,0.10), transparent 70%)",
        }}
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-b from-transparent to-background" />

      {/* items-stretch: la recomendada ocupa la misma altura que la columna principal */}
      <div className="mx-auto grid max-w-[1600px] items-stretch gap-6 px-4 pb-8 pt-5 sm:px-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 lg:px-10 lg:pb-12 lg:pt-10">
        {/* Columna principal: el paquete de la semana */}
        <div className="flex min-w-0 animate-fade-up flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-primary">
              📦 Paquete de esta semana · {SITE.paqueteTamano}
            </span>
            <span className="text-[11px] font-semibold text-accent">{rangoSemanaActual()}</span>
          </div>

          {/* Textos editables en Panel → Portada → Texto de bienvenida */}
          <HeroTexto hero={hero} />
          <AtajosHero chips={hero.chips} />

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
            <a
              href={pedirPaquete}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-whatsapp px-3 py-3 text-[13px] font-black text-black shadow-lg shadow-whatsapp/25 transition hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.97] sm:gap-2 sm:px-6 sm:text-sm"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] shrink-0" />
              Pedir el paquete
            </a>
            <Link
              href="/descripcion"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.03] px-3 py-3 text-[13px] font-bold sm:text-sm text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06] active:scale-[0.97] sm:px-6"
            >
              Ver precios
            </Link>
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-accent">
            <li>🛵 Servicio a domicilio</li>
            {horario && <li>🕘 {horario}</li>}
            <li>💬 Respuesta por WhatsApp</li>
          </ul>

          {/* lg:mt-auto: si la recomendada es más alta, la fila se apoya en el borde inferior */}
          <div className="mt-8 lg:mt-auto lg:pt-8">
            <NuevosRail items={nuevos} titulo={nuevosSonDeLaSemana ? "Lo nuevo de esta semana" : "Lo último que entró"} />
          </div>
        </div>

        {/* Columna lateral: la recomendada */}
        {recomendada && (
          <div className="min-w-0 animate-fade-up [animation-delay:120ms]">
            <RecomendadaCard reco={recomendada} whatsappUrl={whatsappUrl} precios={data.precios} />
          </div>
        )}
      </div>
    </section>
  );
}
