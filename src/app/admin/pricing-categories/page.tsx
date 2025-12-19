"use client";

import { useEffect, useState } from "react";
import { getAllPricingCategories, deletePricingCategory, reorderPricingCategories } from "@/app/actions/pricingCategory.actions";
import { PricingCategory } from "@/app/models/pricingCategory";
import Link from "next/link";
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Tag } from "lucide-react";
import { useToast } from "@/app/context/ToastContext";

export default function PricingCategoriesPage() {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getAllPricingCategories();
      setCategories(data);
    } catch (error: any) {
      showToast("Error al cargar categorías: " + error.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar esta categoría de precios? Esta acción es irreversible.")) return;
    
    try {
      await deletePricingCategory(id);
      showToast("Categoría eliminada correctamente", false);
      loadCategories();
    } catch (error: any) {
      showToast("Error al eliminar: " + error.message, true);
    }
  };

  // Nota: reorderPricingCategories está definido pero no se usa en UI. Se deja para futura implementación (drag & drop).

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-400">Cargando Precios de Categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Tag className="w-7 h-7 text-indigo-400" />
              Categorías de Precios
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Gestiona las categorías de suscripción y precios</p>
          </div>
          <Link
            href="/admin/pricing-categories/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-700 hover:to-amber-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden xs:inline">Nuevo Contenido</span>
          </Link>
        </div>

        {/* Tabla (Desktop) */}
        {categories.length > 0 ? (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700/70 bg-gray-800/80">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/40">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-700/40 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{c.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {c.currency} {c.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.is_active
                              ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800/50"
                              : "bg-red-900/40 text-red-300 border border-red-800/50"
                          }`}
                        >
                          {c.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {c.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/admin/pricing-categories/${c.id}`}
                            className="p-2 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white shadow transition-all duration-200"
                            title="Editar categoría"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow transition-all duration-200"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas (Móvil) */}
            <div className="md:hidden p-4 space-y-4">
              {categories.map((c) => (
                <div key={c.id} className="bg-gray-700/60 backdrop-blur-sm rounded-xl p-4 border border-gray-600/50 shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg">{c.category}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        c.is_active ? "bg-emerald-900/50 text-emerald-300" : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      {c.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">
                    <span className="font-semibold">{c.currency} {c.price.toFixed(2)}</span>
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/pricing-categories/${c.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-center text-sm font-medium"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-center text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-12 text-center">
            <Tag className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No hay categorías de precios creadas aún.</p>
            <Link
              href="/admin/pricing-categories/new"
              className="mt-4 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Plus className="w-5 h-5" />
              Crear primera categoría
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}