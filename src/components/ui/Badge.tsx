type Tono = "exito" | "aviso" | "neutro" | "peligro" | "marca";

const TONOS: Record<Tono, string> = {
  exito: "border-whatsapp/40 bg-whatsapp/15 text-whatsapp",
  aviso: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  neutro: "border-white/15 bg-white/[0.05] text-white/70",
  peligro: "border-offer/40 bg-offer/15 text-red-300",
  marca: "border-primary/40 bg-primary/15 text-primary",
};

export function Badge({ tono = "neutro", children, className = "" }: { tono?: Tono; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${TONOS[tono]} ${className}`}>
      {children}
    </span>
  );
}
