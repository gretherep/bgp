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
          ? "border-brand bg-brand text-white"
          : "border-ink/10 bg-ink/[0.04] text-ink/80 hover:border-ink/25 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
