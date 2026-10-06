// Chip seleccionable usado en la barra de filtros y en la hoja de filtros móvil.
export default function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition active:scale-[0.97] ${
        activo
          ? "border-primary bg-primary text-black"
          : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
