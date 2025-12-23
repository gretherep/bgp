"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPricingCategory } from "@/app/actions/pricingCategory.actions";
import { useToast } from "@/app/context/ToastContext";
import { Tag, DollarSign, Type, FileText, Eye, EyeOff, Hash, Plus, ArrowLeft, Loader2 } from "lucide-react";

// Ajustamos el tipo para que coincida con tu modelo
type MediaCategory =
  | "Películas"
  | "Series"
  | "Novelas"
  | "Reality Shows"
  | "MiniSeries"
  | "Series Animadas"
  | "Películas Animadas"
  | "Anime"


const CATEGORIES: MediaCategory[] = [
  "Películas",
  "Series",
  "Novelas",
  "Reality Shows",
  "MiniSeries",
  "Series Animadas",
  "Películas Animadas",
  "Anime"

];

export default function NewPricingCategoryPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<{
    category: MediaCategory | "";
    price: number;
    currency: string;
    description: string;
    is_active: boolean;
    display_order: number;
  }>({
    category: "",
    price: 0,
    currency: "USD",
    description: "",
    is_active: true,
    display_order: 0,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.category) {
      showToast("Debes seleccionar una categoría", true);
      return;
    }

    setLoading(true);

    try {
      await createPricingCategory({
        category: form.category,
        price: form.price,
        currency: form.currency,
        description: form.description || null,
        is_active: form.is_active,
        display_order: form.display_order,
      });

      showToast("Categoría de precios creada exitosamente", false, 2000);
      router.push("/admin/pricing-categories");
    } catch (err: any) {
      showToast("Error al crear la categoría: " + err.message, true, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a Categorías
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Tag className="w-7 h-7 text-indigo-400" />
            Nueva Categoría de Precio
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Define una nueva opción de suscripción</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5 sm:p-6 md:p-8 shadow-xl">
          <div className="space-y-6">
            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-white font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                Categoría *
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value as MediaCategory)}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                required
              >
                <option value="" className="bg-gray-800">Selecciona una categoría</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-gray-800">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div>
              <label htmlFor="price" className="block text-white font-medium mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                Precio *
              </label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Moneda */}
            <div>
              <label htmlFor="currency" className="block text-white font-medium mb-2 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-400" />
                Moneda *
              </label>
              <input
                type="text"
                id="currency"
                value={form.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="USD, EUR, COP..."
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-white font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Descripción
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Breve descripción de la categoría..."
              />
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-white font-medium flex items-center gap-2">
                {form.is_active ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                {form.is_active ? "Activo" : "Inactivo"}
              </label>
            </div>

            {/* Orden de visualización */}
            <div>
              <label htmlFor="display_order" className="block text-white font-medium mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-400" />
                Orden de visualización
              </label>
              <input
                type="number"
                id="display_order"
                value={form.display_order}
                onChange={(e) => handleChange("display_order", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Crear Categoría
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}