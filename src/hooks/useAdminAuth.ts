import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export const useAdminAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si terminó de cargar y no hay usuario o no es admin
    if (!loading) {
      if (!user) {
        console.log("No hay sesión activa. Redirigiendo al home...");
        router.replace("/"); // Usamos replace para no ensuciar el historial
      } else if (user.role !== "admin") {
        console.log("Usuario no es admin. Role actual:", user.role);
        router.replace("/");
      }
    }
  }, [user, loading, router]);

  return { user, loading }; // Devolvemos esto para que el componente sepa si mostrar contenido
};