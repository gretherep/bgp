"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProfile } from "@/app/actions/profile.actions"; // ✅ Asegúrate de tener esta acción
import { useToast } from "@/app/context/ToastContext";
import { User, Mail, Shield, Loader2, ArrowLeft, Key } from "lucide-react";

export default function CreateProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "", // 🔑 Necesario al crear
    role: "user",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createProfile(formData);
      showToast("Perfil creado exitosamente", false, 2000);
      router.push("/admin/profiles");
    } catch (error: any) {
      showToast("Error al crear perfil: " + error.message, true, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 mt-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a Perfiles
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <User className="w-7 h-7 text-indigo-400" />
            Crear Nuevo Perfil
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Registra un nuevo usuario en el sistema</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5 sm:p-6 md:p-8 shadow-xl">
          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="first_name" className="block text-white font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Nombre *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ingresa el nombre"
              />
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="last_name" className="block text-white font-medium mb-2">
                Apellido *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ingresa el apellido"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-white font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-white font-medium mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Contraseña *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {/* Rol */}
            <div>
              <label htmlFor="role" className="block text-white font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Rol *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none"
              >
                <option value="user" className="bg-gray-800">Usuario</option>
                <option value="admin" className="bg-gray-800">Administrador</option>
              </select>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>Crear Perfil</>
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