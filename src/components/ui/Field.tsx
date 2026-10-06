// Campos de formulario del panel: misma estética que la web (superficie oscura, borde sutil, foco durazno).

const CAMPO =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-white/35 transition focus:border-primary/60 focus:bg-white/[0.07] focus:outline-none disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  contador,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | null;
  contador?: { actual: number; max: number };
  children: React.ReactNode;
  className?: string;
}) {
  const excedido = contador && contador.actual > contador.max;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-bold text-white/90">
          {label}
        </label>
        {contador && (
          <span className={`text-[11px] font-semibold tabular-nums ${excedido ? "text-red-300" : "text-accent"}`}>
            {contador.actual}/{contador.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-300">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-accent">{hint}</p>
      )}
    </div>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CAMPO} h-11 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CAMPO} min-h-[96px] py-3 leading-relaxed ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${CAMPO} h-11 appearance-none pr-10 ${className}`} {...props}>
        {children}
      </select>
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
      </svg>
    </div>
  );
}
