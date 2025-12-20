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
  // Importante: empezamos en true
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (sessionUser: any) => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, first_name, last_name")
          .eq("id", sessionUser.id)
          .single();

        if (mounted) {
          setUser({
            ...sessionUser,
            role: profile?.role || "user",
            first_name: profile?.first_name,
            last_name: profile?.last_name,
          });
        }
      } catch (e) {
        console.error("Error fetching profile", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        if (mounted) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};
