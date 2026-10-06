"use client";

import { GENEROS } from "@/lib/categories";
import { EVENTO_FILTRAR } from "./catalogo/Catalogo";

// Atajos por "estado de ánimo": filtran el catálogo de abajo por un grupo de géneros.
export default function MoodChips() {
  const moods = GENEROS.filter((g) => g.mood);
  const filtrar = (slug: string) =>
    window.dispatchEvent(new CustomEvent(EVENTO_FILTRAR, { detail: { generos: [slug] } }));

  return (
    <section className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-10">
      <h2 className="mb-3 text-lg font-black tracking-tight text-white sm:text-xl">¿Qué quieres ver hoy?</h2>
      <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
        {moods.map((g) => (
          <li key={g.slug} className="shrink-0">
            <button
              type="button"
              onClick={() => filtrar(g.slug)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/85 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/10 hover:text-white active:scale-[0.97]"
            >
              <span className="text-lg leading-none" aria-hidden="true">{g.emoji}</span>
              {g.mood}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
