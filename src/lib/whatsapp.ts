import { SITE } from "./site";

/**
 * Enlace wa.me con mensaje prellenado. `base` es business_info.whatsapp_url, que puede
 * venir como link completo (https://wa.me/53...) o solo como número.
 */
export function waLink(base: string | null | undefined, text?: string): string {
  const raw = (base ?? "").trim();
  let url: URL;
  if (/^\+?\d{6,}$/.test(raw)) {
    url = new URL(`https://wa.me/${raw.replace("+", "")}`);
  } else {
    try {
      url = new URL(raw || SITE.whatsapp);
    } catch {
      url = new URL(SITE.whatsapp);
    }
  }
  url.searchParams.delete("text");
  // encodeURIComponent (espacios como %20): con searchParams salen como "+" y algunas
  // versiones de WhatsApp los muestran literalmente.
  const sep = url.search ? "&" : "?";
  return text ? `${url.toString()}${sep}text=${encodeURIComponent(text)}` : url.toString();
}
