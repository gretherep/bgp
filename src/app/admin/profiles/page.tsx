import type { Metadata } from "next";
import { getAdmin } from "@/lib/adminAuth";
import { createServerClient } from "@/utils/supabaseServer";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";
import { FiltrosUsuarios, ListaUsuarios, type UsuarioFila } from "./UsuariosLista";

export const metadata: Metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

type Params = { q?: string; rol?: string };

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const rol = sp.rol === "admin" || sp.rol === "user" ? sp.rol : null;

  const sb = createServerClient();
  let consulta = sb.from("profiles").select("id,first_name,last_name,email,role,created_at").order("created_at", { ascending: false }).limit(300);
  if (q) {
    const t = q.replace(/[%,()*]/g, " ");
    consulta = consulta.or(`first_name.ilike.*${t}*,last_name.ilike.*${t}*,email.ilike.*${t}*`);
  }
  if (rol) consulta = consulta.eq("role", rol);

  const [lista, votos, totales, yo] = await Promise.all([
    consulta,
    sb.from("ratings").select("user_id"),
    sb.from("profiles").select("role"),
    getAdmin(),
  ]);
  if (lista.error) throw lista.error;

  const votosPorUsuario = new Map<string, number>();
  (votos.data ?? []).forEach((v) => votosPorUsuario.set(v.user_id as string, (votosPorUsuario.get(v.user_id as string) ?? 0) + 1));
  const filas: UsuarioFila[] = (lista.data ?? []).map((u) => ({ ...(u as Omit<UsuarioFila, "votos">), votos: votosPorUsuario.get(u.id as string) ?? 0 }));

  const todos = totales.data ?? [];
  const cuenta = { todos: todos.length, admin: todos.filter((u) => u.role === "admin").length, user: todos.filter((u) => u.role !== "admin").length };

  return (
    <>
      <PageHeader
        titulo="Usuarios"
        descripcion={`${cuenta.todos} cuentas: ${cuenta.admin} ${cuenta.admin === 1 ? "admin" : "admins"} y ${cuenta.user} ${cuenta.user === 1 ? "cliente" : "clientes"}. Los clientes se registran solos desde el sitio para votar.`}
      />
      <FiltrosUsuarios q={q} rol={rol} cuenta={cuenta} />
      <Card>
        {filas.length === 0 ? (
          <div className="p-5">
            <EmptyState emoji="🔎" titulo="Nadie coincide con la búsqueda" texto="Prueba con otra parte del nombre o del correo." />
          </div>
        ) : (
          <ListaUsuarios usuarios={filas} miId={yo?.id ?? null} />
        )}
      </Card>
    </>
  );
}
