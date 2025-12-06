"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
// Asegúrate de que las importaciones de tus modelos y acciones sean correctas
import { Profile } from "@/app/models/profile"; 
import { getProfiles, deleteProfile, updateUserPassword  } from "@/app/actions/profile.actions";
// Necesitarás una Server Action para esto, por ejemplo:
// import { updateUserPassword } from "@/app/actions/user.actions"; 
import Link from "next/link";
import { Edit2, Trash2, ArrowLeft, ArrowRight, Lock, Key } from "lucide-react";

// Número de perfiles por página
const PROFILES_PER_PAGE = 8; 

// Interfaz para el estado del modal de cambio de contraseña
interface PasswordModalState {
  isOpen: boolean;
  userId: string;
  userName: string;
}

export default function AdminProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estado para manejar la confirmación de eliminación (reemplaza a window.confirm)
  const [profileToDeleteId, setProfileToDeleteId] = useState<string | null>(null);

  // Estado del modal de cambio de contraseña
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
      // Asumiendo que getProfiles trae todos los datos para simular la paginación cliente
      const data = await getProfiles(); 
      setProfiles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Paginación ---
  const indexOfLastProfile = currentPage * PROFILES_PER_PAGE;
  // CORRECCIÓN: Usar 'indexOfLastProfile' en lugar del error 'lastProfile'
  const indexOfFirstProfile = indexOfLastProfile - PROFILES_PER_PAGE; 
  const currentProfiles = profiles.slice(indexOfFirstProfile, indexOfLastProfile);

  const totalPages = Math.ceil(profiles.length / PROFILES_PER_PAGE);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // --- Lógica de Eliminación (Custom Confirmation) ---
  const handleDeleteClick = (id: string) => {
    setProfileToDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDeleteId) return;

    try {
      await deleteProfile(profileToDeleteId); // ✅ server action
      setProfiles((prev) => prev.filter((p) => p.id !== profileToDeleteId));
      
      // Ajustar la página si se elimina el último elemento
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
  
  // --- Lógica de Cambio de Contraseña ---
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
    await updateUserPassword(passwordModal.userId, newPassword); // ✅ REAL

    setPasswordModal({ isOpen: false, userId: "", userName: "" });
    alert(`Contraseña de ${passwordModal.userName} actualizada con éxito.`);
  } catch (err: any) {
    setPasswordError(err.message || "Error al actualizar contraseña");
  } finally {
    setIsPasswordUpdating(false);
  }
};


  if (loading) return <div className="text-center py-8 text-indigo-400">Cargando perfiles...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 mt-8 p-4 md:p-0 bg-gray-950 min-h-screen">
      
      {/* Encabezado y Botón Nuevo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Administrar Perfiles</h1>
        <Link
          href="/admin/profiles/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-md w-full sm:w-auto justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Perfil
        </Link>
      </div>

      {/* --- Desktop Table (md:block) --- */}
      {profiles.length > 0 ? (
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-white">
              <thead className="bg-gray-700/70 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Apellido</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentProfiles.map((profile) => (
                  <tr key={profile.id} className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{profile.first_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{profile.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{profile.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center space-x-3">
                      
                      {/* Botón de Cambio de Contraseña */}
                      <button
                        onClick={() => handlePasswordChangeClick(profile)}
                        title="Cambiar Contraseña"
                        className="inline-flex items-center justify-center p-2 rounded-full text-white bg-yellow-600 hover:bg-yellow-700 transition-transform hover:scale-105 shadow-md"
                      >
                         <Key className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/admin/profiles/${profile.id}/edit`}
                        title="Editar Perfil"
                        className="inline-flex items-center justify-center p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-transform hover:scale-105 shadow-md"
                      >
                         <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(profile.id)}
                        title="Eliminar Perfil"
                        className="inline-flex items-center justify-center p-2 rounded-full text-white bg-red-600 hover:bg-red-700 transition-transform hover:scale-105 shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 rounded-xl text-gray-400">
          No hay perfiles registrados aún.
        </div>
      )}

      {/* --- Mobile Cards (md:hidden) --- */}
      <div className="md:hidden space-y-4">
        {currentProfiles.map((profile) => (
          <div key={profile.id} className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
            <div className="flex flex-col mb-3">
              <h3 className="text-xl font-bold text-white mb-1">{profile.first_name} {profile.last_name}</h3>
              <p className="text-sm text-gray-400 truncate">{profile.email}</p>
            </div>
            
            <div className="flex gap-3 pt-3 border-t border-gray-700">
              
              {/* Botón de Cambio de Contraseña (Móvil) */}
              <button
                onClick={() => handlePasswordChangeClick(profile)}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                Password
              </button>

              <Link
                href={`/admin/profiles/${profile.id}/edit`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </Link>
              <button
                onClick={() => handleDeleteClick(profile.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* --- Controles de Paginación --- */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4 bg-gray-800 rounded-xl shadow-xl p-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-full bg-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            title="Página Anterior"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="text-lg font-semibold text-indigo-400">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-full bg-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            title="Página Siguiente"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* --- Custom Confirmation Modal/Overlay (Eliminación) --- */}
      {profileToDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-red-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-500" />
              Confirmar Eliminación
            </h3>
            <p className="text-gray-300 mb-6">
              Estás a punto de eliminar el perfil con ID: <span className="font-mono text-sm text-yellow-400 break-all">{profileToDeleteId}</span>. ¿Estás seguro de que deseas continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Custom Modal (Cambio de Contraseña) --- */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl border border-yellow-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-yellow-400" />
              Cambiar Contraseña para {passwordModal.userName}
            </h3>
            <p className="text-gray-400 mb-4">
              Esta acción forzará el cambio de la contraseña de este usuario. Debe tener al menos 6 caracteres.
            </p>

            <div className="mb-4">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isPasswordUpdating}
              />
            </div>

            {passwordError && (
              <p className="text-red-400 text-sm mb-4">{passwordError}</p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setPasswordModal({ isOpen: false, userId: "", userName: "" })}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                disabled={isPasswordUpdating}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePassword}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                  isPasswordUpdating 
                    ? 'bg-indigo-700 text-white cursor-not-allowed opacity-75' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                disabled={isPasswordUpdating}
              >
                {isPasswordUpdating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Actualizar Contraseña
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