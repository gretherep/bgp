import type { Metadata } from "next";
import { createServerClient } from "@/utils/supabaseServer";
import { PageHeader } from "@/components/ui/Card";
import PreciosEditor, { type PrecioFila } from "./PreciosEditor";

export const metadata: Metadata = { title: "Precios" };
export const dynamic = "force-dynamic";

export default async function PreciosPage() {
  const { data, error } = await createServerClient()
    .from("pricing_categories")
    .select("id,category,price,currency,description,is_active")
    .order("display_order", { ascending: true });
  if (error) throw error;

  return (
    <>
      <PageHeader
        titulo="Precios"
        descripcion="Lo que cuesta cada título. Se usa en las tarjetas del sitio, en «Mi pedido» y en la página de Precios. Los cambios se ven al guardar."
      />
      <PreciosEditor precios={(data ?? []) as PrecioFila[]} />
    </>
  );
}
