"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/apiClient";
import { Profile } from "@/app/models/profile";
import Link from "next/link";
import { Edit2, Trash2, ArrowLeft, ArrowRight, Lock, Key, User, Mail } from "lucide-react";

const PROFILES_PER_PAGE = 8;

interface PasswordModalState {
  isOpen: boolean;
  userId: string;
  userName: string;
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [profileToDeleteId, setProfileToDeleteId] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<PasswordModalState>({
    isOpen: false,
    userId: "",
    userName: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await api.get("/api/users");
      setProfiles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastProfile = currentPage * PROFILES_PER_PAGE;
  const indexOfFirstProfile = indexOfLastProfile - PROFILES_PER_PAGE;
  const currentProfiles = profiles.slice(indexOfFirstProfile, indexOfLastProfile);
  const totalPages = Math.ceil(profiles.length / PROFILES_PER_PAGE);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleDeleteClick = (id: string) => {
    setProfileToDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDeleteId) return;

    try {
      await api.delete(`/api/users?id=${profileToDeleteId}`);
      setProfiles((prev) => prev.filter((p) => p.id !== profileToDeleteId));
      if (currentProfiles.length === 1 && currentPage > 1 && totalPages > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      setError("Error al eliminar: " + err.message);
    } finally {
      setProfileToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setProfileToDeleteId(null);
  };

  const handlePasswordChangeClick = (profile: Profile) => {
    setPasswordModal({
      isOpen: true,
      userId: profile.id,
      userName: `${profile.first_name} ${profile.last_name}`,
    });
    setNewPassword("");
    setPasswordError(null);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsPasswordUpdating(true);
    setPasswordError(null);

    try {
      await api.patch("/api/users", { id: passwordModal.userId, password: newPassword });
      setPasswordModal({ isOpen: false, userId: "", userName: "" });
      alert(`Contraseña de ${passwordModal.userName} actualizada con éxito.`);
    } catch (err: any) {
      setPasswordError(err.message || "Error al actualizar contraseña");
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-400">Cargando profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-800 border border-red-900/50 rounded-xl p-6 max-w-md text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Error al cargar</h3>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 mt-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <User className="w-7 h-7 text-indigo-400" />
              Administrar Perfiles
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Gestiona usuarios y roles del sistema</p>
          </div>
          <Link
            href="/admin/profiles/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-700 hover:to-amber-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>

          </Link>
        </div>

        {/* Tabla (Desktop) */}
        {profiles.length > 0 ? (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700/70 bg-gray-800/80">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" /> Nombre
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Apellido</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/40">
                  {currentProfiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-700/40 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{profile.first_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{profile.last_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-xs">{profile.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handlePasswordChangeClick(profile)}
                            className="p-2 rounded-lg bg-yellow-600/90 hover:bg-yellow-600 text-white shadow transition-all duration-200"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/profiles/${profile.id}/edit`}
                            className="p-2 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white shadow transition-all duration-200"
                            title="Editar perfil"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(profile.id)}
                            className="p-2 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow transition-all duration-200"
                            title="Eliminar perfil"
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
              {currentProfiles.map((profile) => (
                <div key={profile.id} className="bg-gray-700/60 backdrop-blur-sm rounded-xl p-4 border border-gray-600/50 shadow">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white">{profile.first_name} {profile.last_name}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{profile.email}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePasswordChangeClick(profile)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Key className="w-4 h-4 mx-auto" />
                    </button>
                    <Link
                      href={`/admin/profiles/${profile.id}/edit`}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Edit2 className="w-4 h-4 mx-auto" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(profile.id)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-700/50 gap-4">
                <div className="text-sm text-gray-400">
                  Mostrando {indexOfFirstProfile + 1} a {Math.min(indexOfLastProfile, profiles.length)} de {profiles.length} perfiles
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 bg-indigo-600/20 text-indigo-300 font-medium rounded-lg">
                    {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl p-12 text-center">
            <User className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No hay perfiles registrados aún.</p>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {profileToDeleteId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-red-800/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-900/30 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-400 mb-6">
              ¿Estás seguro de que deseas eliminar el perfil con ID:{" "}
              <span className="font-mono text-sm text-yellow-400 break-all">{profileToDeleteId}</span>?
              Esta acción es irreversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Contraseña */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-yellow-800/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-900/30 rounded-lg">
                <Lock className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Cambiar contraseña para <span className="text-indigo-300">{passwordModal.userName}</span>
              </h3>
            </div>
            <p className="text-gray-400 mb-4 text-sm">
              Ingresa una nueva contraseña de al menos 6 caracteres.
            </p>
            <div className="mb-4">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-2">
                Nueva contraseña
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isPasswordUpdating}
              />
            </div>
            {passwordError && <p className="text-red-400 text-sm mb-4">{passwordError}</p>}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
              <button
                onClick={() => setPasswordModal({ isOpen: false, userId: "", userName: "" })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isPasswordUpdating}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={isPasswordUpdating}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isPasswordUpdating
                    ? "bg-indigo-700 text-white cursor-not-allowed opacity-75"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
              >
                {isPasswordUpdating ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Actualizar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}