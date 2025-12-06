"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { LogOut } from "lucide-react"; // Añadimos un ícono para mejor UX

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Media", href: "/admin/media" },
   { name: "Perfiles", href: "/admin/profiles" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
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
        {/* Close button for mobile */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden self-end p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-indigo-400">Admin Panel</h2>

        {/* NAV: flex-grow asegura que este ocupe el espacio restante y empuje el botón al final */}
        <nav className="flex flex-col gap-2 flex-grow overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`p-3 rounded-lg hover:bg-gray-700 transition-colors ${
                pathname.startsWith(item.href) ? "bg-indigo-600 font-semibold" : ""
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Logout button: mt-auto lo ancla al fondo del h-screen */}
        <button
          onClick={handleLogout}
          className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium mt-auto flex items-center justify-center"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar Sesión
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