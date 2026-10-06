import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

// Protección en el servidor: sin sesión de admin no se envía nada del panel al navegador.
// (proxy.ts ya sacó a quien no tiene sesión; aquí se comprueba el rol.)
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/");

  return <AdminShell nombre={admin.nombre}>{children}</AdminShell>;
}
