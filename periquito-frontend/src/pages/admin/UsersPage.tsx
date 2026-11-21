import { useCallback, useMemo, useState, type FormEvent } from "react";
import { KeyRound, Pencil, Plus, UserRound, UserX } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, Form, FormActions, Modal, PageTitle, SearchInput, SelectField, StatusBadge } from "../../components/admin/AdminUi";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { adminService } from "../../services/adminService";
import { getApiErrorMessage } from "../../services/api";
import type { UserDto } from "../../types/admin";
import { formatPeruDateTime } from "../../utils/format";

export function UsersPage() {
  const load = useCallback(() => adminService.users(), []);
  const { data, loading, error, reload } = useApiResource<UserDto[]>(load);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<UserDto | null | undefined>(undefined);
  const [deactivating, setDeactivating] = useState<UserDto | null>(null);
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => (data ?? []).filter((user) => `${user.fullName} ${user.username}`.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))), [data, query]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setSaving(true);
    const passwordValue = String(form.get("password") ?? "");
    try {
      await adminService.saveUser({ username: String(form.get("username") ?? "").trim(), fullName: String(form.get("fullName") ?? "").trim(), password: passwordValue || null, role: String(form.get("role") ?? ""), isActive: form.get("isActive") === "on" }, editing?.id);
      toast.success(editing ? "Usuario actualizado" : "Usuario creado"); setEditing(undefined); await reload();
    } catch (cause) { toast.error("No se pudo guardar el usuario", { description: getApiErrorMessage(cause, "Revisa los datos e inténtalo nuevamente.") }); }
    finally { setSaving(false); }
  }

  async function deactivate() {
    if (!deactivating) return; setSaving(true);
    try { await adminService.deactivateUser(deactivating.id); toast.success("Usuario desactivado"); setDeactivating(null); await reload(); }
    catch (cause) { toast.error("No se pudo desactivar el usuario", { description: getApiErrorMessage(cause, "La API puede impedirlo para proteger al último administrador activo.") }); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <PageTitle title="Usuarios" description="Administra cuentas, roles y estado de acceso." actions={<button className="button-primary" onClick={() => setEditing(null)} type="button"><Plus size={17} />Nuevo usuario</button>} />
    <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o usuario" />
    {loading && <LoadingState label="Cargando usuarios" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && <DataTable rows={filtered} rowKey={(row) => row.id} emptyTitle="No hay usuarios" columns={[
      { key: "user", title: "Usuario", render: (row) => <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal/10 text-teal"><UserRound size={18} /></span><div><p className="font-semibold text-navy">{row.fullName}</p><p className="text-xs text-slate-400">{row.username}</p></div></div> },
      { key: "role", title: "Rol", render: (row) => <StatusBadge tone={row.role === "Administrador" ? "info" : "neutral"}>{row.role}</StatusBadge> },
      { key: "active", title: "Estado", render: (row) => <StatusBadge tone={row.isActive ? "success" : "danger"}>{row.isActive ? "Activo" : "Inactivo"}</StatusBadge> },
      { key: "created", title: "Creado", render: (row) => formatPeruDateTime(row.createdAt) },
      { key: "actions", title: "Acciones", className: "text-right", render: (row) => <div className="flex justify-end gap-1"><button aria-label={`Editar ${row.username}`} className="button-quiet" onClick={() => setEditing(row)} type="button"><Pencil size={16} /></button>{row.isActive && <button aria-label={`Desactivar ${row.username}`} className="button-quiet text-rose-600" onClick={() => setDeactivating(row)} type="button"><UserX size={16} /></button>}</div> },
    ]} />}
    {editing !== undefined && <UserForm initial={editing} saving={saving} onClose={() => setEditing(undefined)} onSubmit={save} />}
    {deactivating && <ConfirmDialog title="Desactivar usuario" description={`¿Desactivar a ${deactivating.fullName}? La API protege al último administrador activo y mostrará el motivo si rechaza la operación.`} loading={saving} onCancel={() => setDeactivating(null)} onConfirm={() => void deactivate()} confirmLabel="Desactivar usuario" />}
  </div>;
}

function UserForm({ initial, saving, onClose, onSubmit }: { initial: UserDto | null; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [role, setRole] = useState(initial?.role ?? "Mesero");
  return <Modal title={initial ? "Editar usuario" : "Registrar usuario"} description="Las contraseñas se envían solo al guardar y nunca se vuelven a mostrar." onClose={onClose}><Form onSubmit={onSubmit}>
    {!initial && <label className="block text-sm font-semibold text-slate-700">Nombre de usuario<input autoComplete="off" className="field-input mt-2 block" maxLength={60} name="username" required /></label>}
    <label className="block text-sm font-semibold text-slate-700">Nombre completo<input className="field-input mt-2 block" defaultValue={initial?.fullName ?? ""} maxLength={120} name="fullName" required /></label>
    <SelectField label="Rol" value={role} onChange={setRole}><option value="Administrador">Administrador</option><option value="Mesero">Mesero</option></SelectField>
    <input name="role" type="hidden" value={role} />
    <label className="block text-sm font-semibold text-slate-700"><span className="flex items-center gap-2"><KeyRound size={15} />{initial ? "Nueva contraseña (opcional)" : "Contraseña"}</span><input autoComplete="new-password" className="field-input mt-2 block" maxLength={128} minLength={12} name="password" required={!initial} type="password" /><span className="mt-1 block text-xs font-normal text-slate-400">Debe tener entre 12 y 128 caracteres. Al editar, déjala vacía para conservar la actual.</span></label>
    {initial && <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input className="size-4 accent-teal" defaultChecked={initial.isActive} name="isActive" type="checkbox" />Usuario activo</label>}
    <FormActions loading={saving} onCancel={onClose} submitLabel={initial ? "Guardar cambios" : "Crear usuario"} />
  </Form></Modal>;
}
