import Link from "next/link";

type Variante = "primario" | "whatsapp" | "secundario" | "fantasma" | "peligro";
type Tamano = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-brand text-white hover:brightness-125",
  whatsapp: "bg-whatsapp text-black hover:brightness-110",
  secundario: "border border-ink/15 bg-ink/[0.03] text-ink hover:border-ink/30 hover:bg-ink/[0.06]",
  fantasma: "text-ink/70 hover:bg-ink/[0.06] hover:text-ink",
  peligro: "border border-offer/40 bg-offer/10 text-red-800 dark:text-red-200 hover:bg-offer/20",
};

const TAMANOS: Record<Tamano, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-sm",
};

export function claseBoton(variante: Variante = "primario", tamano: Tamano = "md", extra = "") {
  return `${BASE} ${VARIANTES[variante]} ${TAMANOS[tamano]} ${extra}`;
}

export function Button({
  variante = "primario",
  tamano = "md",
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamano?: Tamano }) {
  return <button type={type} className={claseBoton(variante, tamano, className)} {...props} />;
}

export function ButtonLink({
  variante = "primario",
  tamano = "md",
  className = "",
  ...props
}: React.ComponentProps<typeof Link> & { variante?: Variante; tamano?: Tamano }) {
  return <Link className={claseBoton(variante, tamano, className)} {...props} />;
}
