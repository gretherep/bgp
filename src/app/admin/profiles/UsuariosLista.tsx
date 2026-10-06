"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Search, Trash2, X } from "lucide-react";
import { useHojaModal } from "@/hooks/useHojaModal";
import { useToast } from "@/app/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field, Input } from "@/components/ui/Field";
import { borrarUsuario, guardarUsuario } from "./actions";

export type UsuarioFila = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  created_at: string | null;
  votos: number;
};

const nombreDe = (u: UsuarioFila) => [u.first_name, u.last_name].map((s) => s?.trim()).filter(Boolean).join(" ");
const fechaAlta = (iso: string | null) => (iso ? new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)).replace(/\./g, "") : "");

/** Búsqueda (con espera de 400 ms) y filtro por rol. El estado vive en la URL. */
export function FiltrosUsuarios({ q, rol, cuenta }: { q: string; rol: string | null; cuenta: { todos: number; admin: number; user: number } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [texto, setTexto] = useState(q);

  const ir = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams();
    Object.entries({ q: texto.trim(), rol: rol ?? "", ...cambios }).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname);
  };

  useEffect(() => {
    if (texto.trim() === q) return;
    const t = setTimeout(() => ir({ q: texto.trim() }), 400);
    return () => clearTimeout(t);
    // ir() se recalcula en cada render; solo debe reaccionar al texto escrito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const opciones = [
    { v: null, t: "Todos", n: cuenta.todos },
    { v: "admin", t: "Admins", n: cuenta.admin },
    { v: "user", t: "Clientes", n: cuenta.user },
  ];

  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
        <Input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre o correo…" aria-label="Buscar por nombre o correo" className="pl-9" />
      </div>
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1" role="group" aria-label="Filtrar por rol">
        {opciones.map((o) => (
          <button
            key={o.t}
            type="button"
            aria-pressed={rol === o.v}
            onClick={() => ir({ rol: o.v })}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold transition sm:flex-none ${rol === o.v ? "bg-primary text-black" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
          >
            {o.t} <span className={rol === o.v ? "text-black/60" : "text-accent"}>{o.n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ListaUsuarios({ usuarios, miId }: { usuarios: UsuarioFila[]; miId: string | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();
  const [editando, setEditando] = useState<UsuarioFila | null>(null);
  const [aBorrar, setABorrar] = useState<UsuarioFila | null>(null);

  const borrar = (u: UsuarioFila) =>
    startTransition(async () => {
      const r = await borrarUsuario(u.id);
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast("Cuenta borrada", false);
      router.refresh();
    });

  return (
    <>
      <ul className="divide-y divide-white/10">
        {usuarios.map((u) => {
          const nombre = nombreDe(u);
          const soyYo = u.id === miId;
          return (
            <li key={u.id} className="flex items-center gap-3 px-3 py-3 sm:px-5">
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black uppercase ${u.role === "admin" ? "bg-primary/20 text-primary" : "bg-white/[0.06] text-white/70"}`}
              >
                {(nombre || u.email || "?").charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className={`truncate text-sm font-bold ${nombre ? "text-white" : "italic text-white/50"}`}>{nombre || "Sin nombre"}</p>
                  {u.role === "admin" ? <Badge tono="marca">Admin</Badge> : <Badge>Cliente</Badge>}
                  {soyYo && <Badge tono="exito">Tú</Badge>}
                </div>
                <p className="truncate text-xs text-white/70">{u.email ?? "—"}</p>
                <p className="text-[11px] text-accent">
                  {u.created_at && <>Desde {fechaAlta(u.created_at)} · </>}
                  {u.votos} {u.votos === 1 ? "voto" : "votos"}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" onClick={() => setEditando(u)} aria-label={`Editar ${nombre || u.email}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                {!soyYo && (
                  <button type="button" onClick={() => setABorrar(u)} aria-label={`Borrar la cuenta de ${nombre || u.email}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-offer/15 hover:text-red-300">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {editando && (
        <EditarUsuario
          usuario={editando}
          soyYo={editando.id === miId}
          onCerrado={(guardado) => {
            setEditando(null);
            if (guardado) router.refresh();
          }}
        />
      )}

      {aBorrar && (
        <ConfirmDialog
          titulo="¿Borrar esta cuenta?"
          texto={<>{aBorrar.email ?? "La cuenta"} ya no podrá iniciar sesión. Esto no se puede deshacer.</>}
          confirmar="Borrar"
          peligro
          onConfirmar={() => borrar(aBorrar)}
          onCerrado={() => setABorrar(null)}
        />
      )}
    </>
  );
}

function EditarUsuario({ usuario: u, soyYo, onCerrado }: { usuario: UsuarioFila; soyYo: boolean; onCerrado: (guardado: boolean) => void }) {
  const { showToast } = useToast();
  const [guardando, startTransition] = useTransition();
  const guardado = useRef(false);
  const cerrar = useHojaModal(() => onCerrado(guardado.current));

  const [f, setF] = useState({ first_name: u.first_name ?? "", last_name: u.last_name ?? "", role: u.role === "admin" ? "admin" : "user", password: "" });
  const [verPass, setVerPass] = useState(false);
  const passCorta = f.password.length > 0 && f.password.length < 8;
  const haciaAdmin = u.role !== "admin" && f.role === "admin";

  const guardar = () =>
    startTransition(async () => {
      const r = await guardarUsuario({ id: u.id, ...f });
      if (!r.ok) return showToast(r.error, true, 5000);
      showToast(f.password ? "Guardado. Avísale de su contraseña nueva." : "Guardado", false);
      guardado.current = true;
      cerrar();
    });

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-label="Editar usuario">
      <button type="button" aria-label="Cerrar sin guardar" onClick={cerrar} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative flex max-h-[92vh] w-full animate-fade-up flex-col rounded-t-3xl border border-b-0 border-white/10 bg-surface [animation-duration:220ms] sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl sm:border-b sm:border-r-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white">Editar usuario</h2>
            <p className="truncate text-xs text-accent">{u.email}</p>
          </div>
          <button type="button" onClick={cerrar} aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" htmlFor="usr-nombre">
              <Input id="usr-nombre" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} maxLength={60} />
            </Field>
            <Field label="Apellido" htmlFor="usr-apellido">
              <Input id="usr-apellido" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} maxLength={60} />
            </Field>
          </div>

          <Field label="Rol" hint={soyYo ? "No puedes quitarte tu propio rol de admin." : haciaAdmin ? "Podrá entrar a este panel y cambiar todo el sitio." : undefined}>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Rol">
              {(
                [
                  { v: "user", t: "Cliente", d: "Vota y ve su pedido" },
                  { v: "admin", t: "Admin", d: "Entra a este panel" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={f.role === o.v}
                  disabled={soyYo}
                  onClick={() => setF({ ...f, role: o.v })}
                  className={`rounded-xl border p-3 text-left transition disabled:opacity-60 ${f.role === o.v ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/25"}`}
                >
                  <span className="block text-sm font-bold text-white">{o.t}</span>
                  <span className="block text-xs text-accent">{o.d}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field
            label="Contraseña nueva"
            htmlFor="usr-pass"
            error={passCorta ? "Mínimo 8 caracteres." : null}
            hint="Solo si la olvidó. Déjala vacía para no cambiarla, y díselo por WhatsApp."
          >
            <div className="relative">
              <Input
                id="usr-pass"
                type={verPass ? "text" : "password"}
                autoComplete="new-password"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setVerPass((v) => !v)}
                aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 hover:text-white"
              >
                {verPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variante="secundario" onClick={cerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando || passCorta}>
            {guardando ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
