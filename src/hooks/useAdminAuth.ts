import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export const useAdminAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo actuamos cuando la carga ha terminado
    if (!loading) {
      if (!user) {
        router.replace("/");
      } else if (user.role !== "admin") {
        console.error("Acceso denegado: El usuario no es admin");
        router.replace("/");
      }
    }
  }, [user, loading, router]);

  return { user, loading };
};