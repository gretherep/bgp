"use server"; // indica que estas funciones son Server Actions

import { createServerClient } from "@/utils/supabaseServer";
import { Profile } from "@/app/models/profile";
import { revalidatePath } from "next/cache";


// Obtener todos los perfiles
export async function getProfiles(): Promise<Profile[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// Obtener un perfil por id
export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createProfile(
  profileData: Omit<Profile, "id" | "created_at" | "updated_at"> & { password: string }
): Promise<Profile> {
  const supabase = createServerClient();

  // 1️⃣ Crear usuario en Auth (esto ya crea el perfil por trigger)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: profileData.email,
    password: profileData.password,
    email_confirm: true,
  });

  if (authError) throw new Error(authError.message);

  const userId = authData.user.id;

  // 2️⃣ SOLO ACTUALIZAMOS el perfil existente
  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      role: "user",
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/profiles");
  return data;
}



// Actualizar datos del perfil
export async function updateProfile(
  id: string,
  profileData: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
): Promise<Profile> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(profileData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/profiles");
  return data;
}

// Cambiar contraseña de un usuario
export async function updateUserPassword(userId: string, newPassword: string) {
  const supabase = createServerClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error("Error cambiando password:", error);
    throw new Error("No se pudo actualizar la contraseña");
  }

  return true;
}

// Eliminar perfil + usuario en Auth
export async function deleteProfile(id: string): Promise<void> {
  const supabase = createServerClient();

  // Eliminar usuario en Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) throw new Error(authError.message);

  // Eliminar registro en profiles
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/profiles");
}
