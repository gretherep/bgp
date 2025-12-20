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
    const fetchProfile = async (sessionUser: any) => {
      // Marcamos como cargando mientras buscamos el perfil
      setLoading(true); 
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, first_name, last_name")
        .eq("id", sessionUser.id)
        .single();

      setUser({
        ...sessionUser,
        role: profile?.role || "user",
        first_name: profile?.first_name,
        last_name: profile?.last_name,
      });
      setLoading(false);
    };

    // 1. Sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};
