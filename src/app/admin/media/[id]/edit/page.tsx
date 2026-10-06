import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/utils/supabaseServer";
import MediaForm, { type TituloEditable } from "../../MediaForm";

export const metadata: Metadata = { title: "Editar título" };
export const dynamic = "force-dynamic";

export default async function EditarTituloPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { data } = await createServerClient()
    .from("media")
    .select("id,title,synopsis,poster_url,genre,year,category,idioma,seasons,estreno")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  // Vuelve a la lista con los mismos filtros y página.
  const filtros = new URLSearchParams();
  for (const k of ["q", "cat", "estreno", "page"]) if (sp[k]) filtros.set(k, sp[k]!);
  const volver = filtros.toString() ? `/admin/media?${filtros}` : "/admin/media";

  return <MediaForm inicial={data as TituloEditable} volver={volver} />;
}
