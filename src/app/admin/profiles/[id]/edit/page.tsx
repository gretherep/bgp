"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getProfile, updateProfile } from "@/app/actions/profile.actions";
import { useToast } from "@/app/context/ToastContext";
import { User, Mail, Shield, Loader2, ArrowLeft } from "lucide-react";

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "user",
  });

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const data = await getProfile(id);
      if (!data) throw new Error("Perfil no encontrado");

      setFormData({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        role: data.role,
      });
    } catch (error: any) {
      showToast("Error al cargar perfil: " + error.message, true);
      router.push("/admin/profiles");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(id, formData);
      showToast("Perfil actualizado correctamente", false);
      router.push("/admin/profiles");
    } catch (error: any) {
      showToast("Error al actualizar perfil: " + error.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

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
            Editar Perfil
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Actualiza la información del usuario</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5 sm:p-6 md:p-8 shadow-xl">
          <div className="space-y-6">
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

            <div>
              <label htmlFor="last_name" className="block text-white font-medium mb-2">Apellido *</label>
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

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>Actualizar Perfil</>
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