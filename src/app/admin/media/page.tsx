import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Sparkles } from "lucide-react";
import { createServerClient } from "@/utils/supabaseServer";
import { MEDIA_CATEGORIES } from "@/app/models/media-categories";
import { ButtonLink } from "@/components/ui/Button";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";
import { BorrarTitulo, CorregirEspacios, EstrenoSwitch, FiltrosCatalogoAdmin } from "./ListaControles";

export const metadata: Metadata = { title: "Catálogo" };
export const dynamic = "force-dynamic";

const POR_PAGINA = 20;

type Fila = { id: string; title: string; year: number; category: string; poster_url: string | null; poster_thumb_url: string | null; estreno: boolean | null; idioma: string | null; seasons: number | null };
type Params = { q?: string; cat?: string; estreno?: string; page?: string };

export default async function CatalogoAdminPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const cat = MEDIA_CATEGORIES.find((c) => c === sp.cat) ?? null;
  const soloEstrenos = sp.estreno === "1";
  const pagina = Math.max(1, Math.min(parseInt(sp.page ?? "1", 10) || 1, 500));

  const sb = createServerClient();
  let consulta = sb
    .from("media")
    .select("id,title,year,category,poster_url,poster_thumb_url,estreno,idioma,seasons", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);
  if (q) consulta = consulta.ilike("title", `%${q.replace(/[%,()]/g, " ")}%`);
  if (cat) consulta = consulta.eq("category", cat);
  if (soloEstrenos) consulta = consulta.eq("estreno", true);

  const [lista, espIni, espFin] = await Promise.all([
    consulta,
    sb.from("media").select("id", { count: "exact", head: true }).like("title", " %"),
    sb.from("media").select("id", { count: "exact", head: true }).like("title", "% "),
  ]);

  const filas = (lista.data ?? []) as Fila[];
  const total = lista.count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const conEspacios = (espIni.count ?? 0) + (espFin.count ?? 0);
  const hayFiltros = !!(q || cat || soloEstrenos);

  // Conserva los filtros al ir a editar y al volver.
  const volver = new URLSearchParams(Object.entries({ q, cat: cat ?? "", estreno: soloEstrenos ? "1" : "", page: pagina > 1 ? String(pagina) : "" }).filter(([, v]) => v)).toString();
  const urlPagina = (n: number) => {
    const p = new URLSearchParams(volver);
    if (n > 1) p.set("page", String(n));
    else p.delete("page");
    const s = p.toString();
    return s ? `/admin/media?${s}` : "/admin/media";
  };

  return (
    <>
      <PageHeader
        titulo="Catálogo"
        descripcion={`${total.toLocaleString("es")} ${total === 1 ? "título" : "títulos"}${hayFiltros ? " con estos filtros" : ""}. Lo que cambies aquí se ve en el sitio al guardar.`}
        acciones={
          <ButtonLink href="/admin/media/new">
            <Plus className="h-4 w-4" aria-hidden="true" /> Agregar título
          </ButtonLink>
        }
      />

      {conEspacios > 0 && <CorregirEspacios cantidad={conEspacios} />}

      <FiltrosCatalogoAdmin q={q} cat={cat} soloEstrenos={soloEstrenos} categorias={[...MEDIA_CATEGORIES]} />

      {filas.length === 0 ? (
        <EmptyState
          emoji="🎞️"
          titulo={hayFiltros ? "No hay títulos con esos filtros" : "El catálogo está vacío"}
          texto={hayFiltros ? "Prueba con otro nombre o quita los filtros." : "Agrega el primer título para que aparezca en el sitio."}
          accion={<ButtonLink href={hayFiltros ? "/admin/media" : "/admin/media/new"} variante="secundario">{hayFiltros ? "Quitar filtros" : "Agregar título"}</ButtonLink>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-white/5">
            {filas.map((m) => {
              const editar = `/admin/media/${m.id}/edit${volver ? `?${volver}` : ""}`;
              return (
                <li key={m.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <Link href={editar} className="shrink-0" aria-label={`Editar ${m.title}`}>
                    {m.poster_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.poster_thumb_url || m.poster_url} alt="" width={40} height={60} loading="lazy" decoding="async" className="h-[60px] w-10 rounded-md object-cover ring-1 ring-white/10" />
                    ) : (
                      <span className="flex h-[60px] w-10 items-center justify-center rounded-md bg-offer/15 text-[9px] font-bold text-red-300 ring-1 ring-offer/30">Sin póster</span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={editar} className="block truncate text-sm font-bold text-white hover:text-primary">
                      {m.title}
                    </Link>
                    <p className="truncate text-xs text-accent">
                      {m.year} · {m.category}
                      {m.seasons ? ` · ${m.seasons} temp.` : ""}
                      {m.idioma ? ` · ${m.idioma}` : ""}
                    </p>
                  </div>
                  <EstrenoSwitch id={m.id} titulo={m.title} estreno={!!m.estreno} />
                  <div className="flex shrink-0 items-center">
                    <Link href={`/admin/portada?recomendar=${m.id}`} aria-label={`Recomendar ${m.title} esta semana`} title="Recomendar esta semana" className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-primary/15 hover:text-primary sm:flex">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link href={editar} aria-label={`Editar ${m.title}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <BorrarTitulo id={m.id} titulo={m.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {paginas > 1 && (
        <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Páginas">
          {pagina > 1 ? <ButtonLink href={urlPagina(pagina - 1)} variante="secundario" tamano="sm">← Anterior</ButtonLink> : <span />}
          <span className="text-sm font-semibold text-accent">Página {pagina} de {paginas}</span>
          {pagina < paginas ? <ButtonLink href={urlPagina(pagina + 1)} variante="secundario" tamano="sm">Siguiente →</ButtonLink> : <span />}
        </nav>
      )}
    </>
  );
}
