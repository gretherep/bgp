import type { Metadata } from "next";
import { createServerClient } from "@/utils/supabaseServer";
import { CARD_FIELDS } from "@/lib/catalogQuery";
import type { HomeMedia } from "@/lib/catalog";
import type { Precio } from "@/lib/precios";
import { PageHeader } from "@/components/ui/Card";
import RecomendadaEditor, { type RecomendacionGuardada } from "./RecomendadaEditor";
import PromosEditor, { type PromoFila } from "./PromosEditor";
import HeroEditor from "./HeroEditor";
import { heroDesde } from "@/lib/hero";

export const metadata: Metadata = { title: "Portada" };
export const dynamic = "force-dynamic";

export default async function PortadaPage({ searchParams }: { searchParams: Promise<{ recomendar?: string }> }) {
  const { recomendar } = await searchParams;
  const sb = createServerClient();
  const [recos, promos, precios, info, preseleccion] = await Promise.all([
    sb.from("recomendacion")
      .select(`id, frase, razones, activa, desde, hasta, created_at, media:media_id(${CARD_FIELDS})`)
      .order("created_at", { ascending: false })
      .limit(11),
    sb.from("promos")
      .select("id,kind,titulo,subtitulo,badge,cta_label,cta_mensaje,min_items,desde,hasta,prioridad,activa")
      .order("prioridad", { ascending: false }),
    sb.from("pricing_categories").select("category,price,currency").eq("is_active", true),
    // "*": así se sabe si ya existe la columna hero (SQL 006).
    sb.from("business_info").select("*").limit(1).maybeSingle(),
    // "⭐ Recomendar esta semana" desde el Catálogo
    recomendar ? sb.from("media").select(CARD_FIELDS).eq("id", recomendar).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const todas = ((recos.data ?? []) as unknown as (RecomendacionGuardada & { media: HomeMedia | null })[]).filter((r) => r.media);
  const activa = todas.find((r) => r.activa) ?? null;
  const historial = todas.filter((r) => !r.activa).slice(0, 10);

  return (
    <>
      <PageHeader
        titulo="Portada"
        descripcion="Lo primero que ve el cliente al entrar: el texto de bienvenida, la recomendada de la semana y las promociones. Los cambios se publican en el Inicio al guardar."
      />
      <div className="space-y-8">
        <HeroEditor guardado={heroDesde(info.data?.hero)} disponible={!!info.data && "hero" in info.data} />
        <RecomendadaEditor
          key={recomendar ?? "actual"}
          preseleccion={(preseleccion.data as unknown as HomeMedia | null) ?? null}
          activa={activa}
          historial={historial}
          precios={(precios.data ?? []) as Precio[]}
          whatsappUrl={info.data?.whatsapp_url ?? null}
        />
        <PromosEditor promos={(promos.data ?? []) as PromoFila[]} whatsappUrl={info.data?.whatsapp_url ?? null} />
      </div>
    </>
  );
}
