import type { Metadata } from "next";
import MediaForm from "../MediaForm";

export const metadata: Metadata = { title: "Agregar título" };

export default function NuevoTituloPage() {
  return <MediaForm inicial={null} volver="/admin/media" />;
}
