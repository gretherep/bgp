// Tema claro por defecto; la clase "dark" en <html> activa el oscuro (colores en src/styles/globals.css).
// La elección se guarda en este teléfono/PC (localStorage).

export const CLAVE_TEMA = "bgp-tema";
const COLOR_BARRA = { claro: "#D9D9D9", oscuro: "#000000" };

/** Va en <head> y corre antes de pintar: si el usuario eligió oscuro, la página no parpadea en claro. */
export const SCRIPT_TEMA = `try{if(localStorage.getItem("${CLAVE_TEMA}")==="oscuro"){document.documentElement.classList.add("dark");document.addEventListener("DOMContentLoaded",function(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","${COLOR_BARRA.oscuro}")})}}catch(e){}`;

export function temaOscuroActivo(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function aplicarTema(oscuro: boolean) {
  const html = document.documentElement;
  // Sin transiciones durante el cambio: todo cambia a la vez (ver globals.css)
  html.setAttribute("data-cambiando-tema", "");
  html.classList.toggle("dark", oscuro);
  try {
    localStorage.setItem(CLAVE_TEMA, oscuro ? "oscuro" : "claro");
  } catch {
    // Navegación privada o almacenamiento bloqueado: el tema vale solo para esta visita
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", oscuro ? COLOR_BARRA.oscuro : COLOR_BARRA.claro);
  requestAnimationFrame(() => requestAnimationFrame(() => html.removeAttribute("data-cambiando-tema")));
}

/** Para useSyncExternalStore: avisa cuando cambia la clase de <html> (mantiene sincronizados todos los interruptores). */
export function suscribirTema(aviso: () => void) {
  const mo = new MutationObserver(aviso);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}
