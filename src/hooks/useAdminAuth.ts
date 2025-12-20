import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export const useAdminAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirigir si el proceso de carga terminó REALMENTE
    if (!loading) {
      if (!user || user.role !== "admin") {
        console.log("Acceso denegado. Redirigiendo...");
        router.push("/");
      }
    }
  }, [user, loading, router]);
};
