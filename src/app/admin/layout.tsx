"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/hooks/useAuth"; // Cambiamos a useAuth directamente
import { 
  LogOut, 
  LayoutDashboard, 
  Film, 
  Users, 
  FileText, 
  CreditCard, 
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: "Media", href: "/admin/media", icon: <Film className="w-5 h-5" /> },
  { name: "Descripción", href: "/admin/descripcion", icon: <FileText className="w-5 h-5" /> },
  { name: "Precios", href: "/admin/pricing-categories", icon: <CreditCard className="w-5 h-5" /> },
  { name: "Perfiles", href: "/admin/profiles", icon: <Users className="w-5 h-5" /> },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth(); // Usamos el estado aquí directamente
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Efecto de redirección si no es admin (Seguridad)
  if (!loading && (!user || user.role !== "admin")) {
    router.replace("/");
    return null;
  }

  // 2. Mientras carga la sesión, mostramos un esqueleto o pantalla de carga limpia
  // Esto evita el "parpadeo" donde se ve el panel antes de echar al usuario
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    if (!confirm("¿Seguro que quieres cerrar sesión?")) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-white/5 p-6 
          flex flex-col gap-6 h-screen 
          transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
            Panel Admin
          </h2>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  pathname.startsWith(item.href)
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 font-medium border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-grow p-6 md:ml-64 lg:p-10"> 
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}