"use client";

export function Switch({
  activo,
  onChange,
  label,
  disabled = false,
}: {
  activo: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!activo)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition disabled:opacity-50 ${
        activo ? "border-whatsapp/60 bg-whatsapp/80" : "border-white/15 bg-white/10"
      }`}
    >
      <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${activo ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
    </button>
  );
}
