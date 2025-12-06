import React, { useState, useEffect } from "react";
import MediaList from "./MediaList";
import MediaForm from "./MediaForm";

import { Media } from "../models/media";
import { supabase } from "@/utils/supabaseClient";
import { createMedia, deleteMedia, getAllMedia, updateMedia } from "../actions/media.actions";


export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [editing, setEditing] = useState<Media | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [userId, setUserId] = useState<string | null>(null);

  // Obtener usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile) setUserRole(profile.role);
      }
    };
    fetchUser();
  }, []);

  const loadMedia = async () => {
    const data = await getAllMedia();
    setMedia(data);
  };

  useEffect(() => { loadMedia(); }, []);

  const handleSubmit = async (formData: FormData) => {
    if (!userId) return;
    try {
      if (editing) {
        await updateMedia(editing.id, formData, userId);
        setEditing(null);
      } else {
        await createMedia(formData, userId);
      }
      await loadMedia();
    } catch (err) {
      alert(err);
    }
  };

  const handleEdit = (item: Media) => setEditing(item);
  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (!confirm("¿Seguro que quieres eliminar este item?")) return;
    await deleteMedia(id, userId);
    await loadMedia();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <MediaForm onSubmit={handleSubmit} initialData={editing ?? undefined} userRole={userRole} />
      <MediaList media={media} userRole={userRole} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
