import type { HeroTextos } from "@/lib/hero";

/** Titular y subtexto del Hero. Lo usan el Inicio y la vista previa del panel (mismo aspecto). */
export default function HeroTexto({ hero, Etiqueta = "h1" }: { hero: Pick<HeroTextos, "titulo" | "destacado" | "subtexto">; Etiqueta?: "h1" | "p" }) {
  return (
    <>
      <Etiqueta className="mt-4 text-[clamp(1.85rem,4.4vw,3.6rem)] font-black leading-[1.04] tracking-tight text-white">
        {hero.titulo}
        {hero.destacado && (
          <>
            <br className="hidden sm:block" /> <span className="text-primary">{hero.destacado}</span>
          </>
        )}
      </Etiqueta>
      <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">{hero.subtexto}</p>
    </>
  );
}
