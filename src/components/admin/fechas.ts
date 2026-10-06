// Fechas de los formularios del panel (<input type="date">, hora local de quien edita).

const dos = (n: number) => String(n).padStart(2, "0");

/** Date → "YYYY-MM-DD" (local). */
export function aCampo(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** ISO guardado → "YYYY-MM-DD" para el campo; vacío si no hay fecha. */
export function isoACampo(iso: string | null | undefined): string {
  return iso ? aCampo(new Date(iso)) : "";
}

/** "YYYY-MM-DD" → ISO al inicio (00:00) o al final (23:59:59) de ese día. */
export function campoAIso(valor: string, finDelDia = false): string | null {
  if (!valor) return null;
  return new Date(`${valor}T${finDelDia ? "23:59:59" : "00:00:00"}`).toISOString();
}

export function hoyCampo(): string {
  return aCampo(new Date());
}

/** Domingo que cierra la semana. Si hoy ya es domingo, el siguiente (si no, duraría solo unas horas). */
export function domingoCampo(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return aCampo(d);
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short" }).format(new Date(iso)).replace(/\./g, "");
}

export type EstadoVigencia = "activa" | "programada" | "vencida" | "pausada";

export function estadoVigencia(p: { activa: boolean; desde: string | null; hasta: string | null }, ahora = Date.now()): EstadoVigencia {
  if (!p.activa) return "pausada";
  if (p.desde && new Date(p.desde).getTime() > ahora) return "programada";
  if (p.hasta && new Date(p.hasta).getTime() <= ahora) return "vencida";
  return "activa";
}
