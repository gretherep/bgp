"use server"; // indica que estas funciones son Server Actions

import { createServerClient } from "@/utils/supabaseServer";
import { Profile } from "@/app/models/profile";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/utils/auth";


export async function getProfiles(): Promise<Profile[]> {
  await requireAdminAction();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getProfile(id: string): Promise<Profile | null> {
  try {
    await requireAdminAction();
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching profile from DB:", error.message);
      throw new Error(`Error al obtener perfil: ${error.message}`);
    }
    return data;
  } catch (err: any) {
    console.error("Critical error in getProfile action:", err.message);
    throw err;
  }
}

export async function createProfile(
  profileData: Omit<Profile, "id" | "created_at" | "updated_at"> & { password: string }
): Promise<Profile> {
  await requireAdminAction();
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



export async function updateProfile(
  id: string,
  profileData: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
): Promise<Profile> {
  try {
    await requireAdminAction();
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile in DB:", error.message);
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }

    revalidatePath("/admin/profiles");
    return data;
  } catch (err: any) {
    console.error("Critical error in updateProfile action:", err.message);
    throw err;
  }
}

export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    await requireAdminAction();
    const supabase = createServerClient();

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error("Error changing password in Auth:", error.message);
      throw new Error(`No se pudo actualizar la contraseña: ${error.message}`);
    }

    return true;
  } catch (err: any) {
    console.error("Critical error in updateUserPassword action:", err.message);
    throw err;
  }
}

export async function deleteProfile(id: string): Promise<void> {
  try {
    await requireAdminAction();
    const supabase = createServerClient();

    // Eliminar usuario en Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      console.error("Error deleting user from Auth:", authError.message);
      throw new Error(`Error al eliminar usuario de Auth: ${authError.message}`);
    }

    // Eliminar registro en profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) {
      console.error("Error deleting profile from DB:", profileError.message);
      throw new Error(`Error al eliminar perfil de la base de datos: ${profileError.message}`);
    }

    revalidatePath("/admin/profiles");
  } catch (err: any) {
    console.error("Critical error in deleteProfile action:", err.message);
    throw err;
  }
}
