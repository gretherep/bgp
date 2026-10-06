import type { Metadata } from "next";
import { createServerClient } from "@/utils/supabaseServer";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import NegocioForm, { type NegocioEditable } from "./NegocioForm";

export const metadata: Metadata = { title: "Negocio" };
export const dynamic = "force-dynamic";

export default async function NegocioPage() {
  // "*": así se sabe si ya existe la columna horario (SQL 002).
  const { data, error } = await createServerClient().from("business_info").select("*").limit(1).maybeSingle();
  if (error) throw error;

  return (
    <>
      <PageHeader titulo="Negocio" descripcion="Tu número de WhatsApp, el horario y el texto de la página de Precios. Los cambios se ven en el sitio al guardar." />
      {data ? (
        <NegocioForm
          inicial={{
            id: data.id,
            title: data.title ?? "",
            description: (data.description ?? "").replace(/\r\n/g, "\n"), // el textarea trabaja con \n
            image_url: data.image_url ?? null,
            whatsapp_url: data.whatsapp_url ?? null,
            horario: "horario" in data ? (data.horario ?? "") : null,
          } satisfies NegocioEditable}
        />
      ) : (
        <EmptyState emoji="🏪" titulo="No hay datos del negocio" texto="Falta la fila de business_info en la base de datos." />
      )}
    </>
  );
}
