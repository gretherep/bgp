export function Card({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 rounded-2xl border border-white/10 bg-surface ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-black text-white">{titulo}</h2>
        {descripcion && <p className="mt-0.5 text-sm text-accent">{descripcion}</p>}
      </div>
      {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
    </div>
  );
}

export function PageHeader({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-2xl text-sm text-accent">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}

export function EmptyState({
  emoji,
  titulo,
  texto,
  accion,
}: {
  emoji: string;
  titulo: string;
  texto?: React.ReactNode;
  accion?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
      <p className="text-3xl" aria-hidden="true">{emoji}</p>
      <p className="mt-2 font-bold text-white">{titulo}</p>
      {texto && <p className="mx-auto mt-1 max-w-md text-sm text-accent">{texto}</p>}
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}
