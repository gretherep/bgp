"use client";

import { useEffect, useState } from "react";
import { getBusinessInfo, updateBusinessInfo } from "@/app/actions/business.actions";
import { useToast } from "@/app/context/ToastContext";
import {
  Building,
  Image as ImageIcon,
  FileText,
  Wallet,
  Phone,
  MessageCircle,
  Edit2,
  Save,
  X,
  Loader2
} from "lucide-react";
import { BusinessInfo } from "@/app/models/businessInfo";

export default function AdminBusinessPage() {
  const [info, setInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessInfo>>({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);


  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      const data = await getBusinessInfo();
      if (data) {
        setInfo(data);
        setFormData(data);
        setLogoPreview(data.image_url ?? null); // mostrar logo guardado
      }
    } catch (err: any) {
      showToast("Error al cargar información del negocio", true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BusinessInfo, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (file: File | null) => {
    if (!file) return;

    setLogoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const handleSave = async () => {
    if (!info) return;
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("id", info.id);
      fd.append("title", formData.title ?? "");
      fd.append("description", formData.description ?? "");
      fd.append("whatsapp_url", formData.whatsapp_url ?? "");
      fd.append("telegram_url", formData.telegram_url ?? "");
      fd.append("current_image", info.image_url ?? "");

      if (logoFile) {
        fd.append("image", logoFile);
      }

      await updateBusinessInfo(fd);

      showToast("Información actualizada con éxito", false);
      setIsEditing(false);
      fetchBusinessInfo();
    } catch (err: any) {
      showToast("Error al actualizar", true);
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-400">Cargando Descripcion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-800 border border-red-900/50 rounded-xl p-6 max-w-md text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Error</h3>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <Building className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p>No se encontró información del negocio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Building className="w-7 h-7 text-indigo-400" />
            Información del Negocio
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Gestiona los datos públicos de tu plataforma</p>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
          {/* Barra de acciones */}
          <div className="px-6 py-4 border-b border-gray-700/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Detalles</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isEditing
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Cancelar
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Editar
                </>
              )}
            </button>
          </div>

          {/* Formulario */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Título */}
              <div>
                <label htmlFor="title" className="block text-white font-medium mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-400" />
                  Título de la plataforma
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title ?? ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Logo
                </label>

                {logoPreview || info?.image_url ? (
                  <img
                    src={logoPreview || info?.image_url!}
                    className="h-24 mb-3 rounded-lg object-contain bg-gray-700 p-2"
                  />
                ) : null}

                <input
                  type="file"
                  accept="image/*"
                  disabled={!isEditing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setLogoFile(file);
                    setLogoPreview(URL.createObjectURL(file));
                  }}
                  className="block w-full text-sm text-gray-300"
                />
              </div>


              {/* Descripción */}
              <div>
                <label htmlFor="description" className="block text-white font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={formData.description ?? ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Breve descripción de tu plataforma..."
                />
              </div>

              {/* Contactos */}
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-400" />
                  Información de contacto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="whatsapp_url" className="block text-gray-300 text-sm mb-1 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                      WhatsApp (Número o Link)
                    </label>
                    <input
                      id="whatsapp_url"
                      type="text"
                      value={formData.whatsapp_url ?? ""}
                      onChange={(e) => handleChange("whatsapp_url", e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Ej: 5351234567 o link completo"
                    />
                  </div>
                  <div>
                    <label htmlFor="telegram_url" className="block text-gray-300 text-sm mb-1 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                      Telegram
                    </label>
                    <input
                      id="telegram_url"
                      type="text"
                      value={formData.telegram_url ?? ""}
                      onChange={(e) => handleChange("telegram_url", e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="https://t.me/..."
                    />
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              {isEditing && (
                <div className="flex justify-end pt-4 border-t border-gray-700/50">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}