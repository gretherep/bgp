"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { 
  LogOut, 
  LayoutDashboard, 
  Film, 
  Users,       // ✅ Cambiado: User → Users
  FileText,    // ✅ Nuevo: para "Descripción"
  CreditCard,  // ✅ Nuevo: para "Precios"
  Menu, 
  X 
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
  useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    if (!confirm("¿Seguro que quieres cerrar sesión?")) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    // Se mantiene flex y min-h-screen
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

      {/* Sidebar: Ahora FIXED en todas las pantallas. h-screen fuerza la altura de la pantalla. */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 p-6 
          flex flex-col gap-6 h-screen 
          transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        {/* Header del sidebar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
            Admin
          </h2>
        </div>

        {/* Navegación */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  pathname.startsWith(item.href)
                    ? "bg-indigo-600/30 text-indigo-200 border-l-2 border-indigo-400"
                    : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Logout button: mt-auto lo ancla al fondo del h-screen */}
        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-red-200 hover:bg-red-900/30 transition-all duration-200 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content: AGREGAMOS md:ml-64 para compensar el sidebar fijo */}
      <main className="flex-grow p-6 md:ml-64"> 
        {children}
      </main>
    </div>
  );
}