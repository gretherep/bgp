"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  if (!isOpen) return null;

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: "user",
            },
          },
        });

        if (error) throw error;

        showToast("¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.", false, 5000);
        onClose();
        return;
      }

      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!user) throw new Error("No se pudo obtener el usuario.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, first_name")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      showToast(`¡Bienvenido${profile.first_name ? `, ${profile.first_name}` : ""}!`, false, 2000);

      if (profile.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(`Error: ${err.message || "Algo salió mal. Inténtalo de nuevo."}`, true, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 text-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-700/50">
          <h2 className="text-xl font-bold text-white">
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Apellidos</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Correo electrónico</label>
            <input
              type="email"
              className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  // Ojo abierto (mostrando)
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  // Ojo tachado (oculto)
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" fill-rule="evenodd" d="m18.67 16.973l2.755 2.755l-.849.848L3.85 3.85L4.697 3l2.855 2.855C8.932 5.303 10.432 5 12 5c4.808 0 8.972 2.848 11 7a12.65 12.65 0 0 1-4.33 4.973M8.486 6.79l1.664 1.664a4 4 0 0 1 5.398 5.398l2.255 2.255c1.574-1 2.904-2.403 3.845-4.106C19.686 8.45 16.034 6.2 12 6.2a10.8 10.8 0 0 0-3.514.59m6.152 6.152a2.8 2.8 0 0 0-3.579-3.579zm1.81 5.204c-1.38.552-2.88.855-4.448.855c-4.808 0-8.972-2.848-11-7a12.65 12.65 0 0 1 4.33-4.973l.867.867A11.36 11.36 0 0 0 2.352 12c1.962 3.55 5.614 5.8 9.648 5.8a10.8 10.8 0 0 0 3.514-.59l.934.935zM8.453 10.15l.909.91a2.8 2.8 0 0 0 3.579 3.579l.91.908a4 4 0 0 1-5.398-5.398z"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-800"
          >
            {loading ? "Procesando..." : isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </form>

        {/* Toggle */}
        <div className="px-6 pb-5 text-center">
          <button
            type="button"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </button>
        </div>

        {/* Close button (opcional, ya se cierra al hacer click fuera) */}
        <div className="px-6 pb-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}