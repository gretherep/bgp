import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { User } from "@supabase/supabase-js";

interface AppUser extends User {
  role?: string;
  first_name?: string;
  last_name?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ 1. Obtener sesión inicial
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, first_name, last_name")
          .eq("id", session.user.id)
          .single();

        setUser({
          ...session.user,
          role: profile?.role || "user",
          first_name: profile?.first_name,
          last_name: profile?.last_name,
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    getUser();

    // ✅ 2. Escuchar cambios de sesión correctamente (v2)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, first_name, last_name")
          .eq("id", session.user.id)
          .single();

        setUser({
          ...session.user,
          role: profile?.role || "user",
          first_name: profile?.first_name,
          last_name: profile?.last_name,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};
