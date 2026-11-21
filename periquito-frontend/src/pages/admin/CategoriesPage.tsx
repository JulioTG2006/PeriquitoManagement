import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, Form, FormActions, Modal, PageTitle, SearchInput, StatusBadge } from "../../components/admin/AdminUi";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { adminService } from "../../services/adminService";
import { getApiErrorMessage } from "../../services/api";
import type { CategoryDto } from "../../types/admin";

export function CategoriesPage() {
  const load = useCallback(() => adminService.categories(), []);
  const { data, loading, error, reload } = useApiResource<CategoryDto[]>(load);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CategoryDto | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<CategoryDto | null>(null);
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => (data ?? []).filter((category) => category.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))), [data, query]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await adminService.saveCategory({ name: String(form.get("name") ?? "").trim(), isActive: form.get("isActive") === "on" }, editing?.id);
      toast.success(editing ? "Categoría actualizada" : "Categoría creada");
      setEditing(undefined);
      await reload();
    } catch (cause) { toast.error("No se pudo guardar la categoría", { description: getApiErrorMessage(cause, "Revisa los datos e inténtalo nuevamente.") }); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!deleting) return;
    setSaving(true);
    try { await adminService.deleteCategory(deleting.id); toast.success("Categoría eliminada"); setDeleting(null); await reload(); }
    catch (cause) { toast.error("No se pudo eliminar la categoría", { description: getApiErrorMessage(cause, "Puede tener platos relacionados o ya no existir.") }); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <PageTitle title="Categorías" description="Organiza los platos de la carta." actions={<button className="button-primary" onClick={() => setEditing(null)} type="button"><Plus size={17} />Nueva categoría</button>} />
    <div className="flex flex-wrap items-center gap-3"><SearchInput value={query} onChange={setQuery} placeholder="Buscar categoría" /><span className="text-sm text-slate-500">{filtered.length} resultados</span></div>
    {loading && <LoadingState label="Cargando categorías" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && <DataTable rows={filtered} rowKey={(row) => row.id} emptyTitle={query ? "No hay coincidencias" : "Todavía no hay categorías"} columns={[
      { key: "name", title: "Nombre", render: (row) => <span className="font-semibold text-navy">{row.name}</span> },
      { key: "status", title: "Estado", render: (row) => <StatusBadge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Activa" : "Inactiva"}</StatusBadge> },
      { key: "actions", title: "Acciones", className: "text-right", render: (row) => <div className="flex justify-end gap-1"><button aria-label={`Editar ${row.name}`} className="button-quiet" onClick={() => setEditing(row)} type="button"><Pencil size={16} /></button><button aria-label={`Eliminar ${row.name}`} className="button-quiet text-rose-600" onClick={() => setDeleting(row)} type="button"><Trash2 size={16} /></button></div> },
    ]} />}
    {editing !== undefined && <CategoryForm initial={editing} saving={saving} onClose={() => setEditing(undefined)} onSubmit={save} />}
    {deleting && <ConfirmDialog title="Eliminar categoría" description={`¿Eliminar “${deleting.name}”? Si tiene platos relacionados, la API rechazará la operación y mostrará el motivo.`} loading={saving} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} confirmLabel="Eliminar categoría" />}
  </div>;
}

function CategoryForm({ initial, saving, onClose, onSubmit }: { initial: CategoryDto | null; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={initial ? "Editar categoría" : "Nueva categoría"} description="El nombre debe ser único según las reglas de la API." onClose={onClose}><Form onSubmit={onSubmit}>
      <label className="block text-sm font-semibold text-slate-700">Nombre<input className="field-input mt-2 block" defaultValue={initial?.name ?? ""} maxLength={80} name="name" placeholder="Ej. Entradas" required /></label>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input className="size-4 accent-teal" defaultChecked={initial?.isActive ?? true} name="isActive" type="checkbox" />Categoría activa</label>
      <FormActions loading={saving} onCancel={onClose} submitLabel={initial ? "Guardar cambios" : "Crear categoría"} /></Form></Modal>;
}
