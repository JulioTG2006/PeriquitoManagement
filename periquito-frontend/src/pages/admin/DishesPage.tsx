import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import { CookingPot, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, Form, FormActions, Modal, PageTitle, SearchInput, SelectField, StatusBadge } from "../../components/admin/AdminUi";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { adminService } from "../../services/adminService";
import { getApiErrorMessage } from "../../services/api";
import type { AdminDishDto, CategoryDto } from "../../types/admin";
import { formatCurrency } from "../../utils/format";

export function DishesPage() {
  const [categoryId, setCategoryId] = useState("");
  const [availability, setAvailabilityFilter] = useState("");
  const [query, setQuery] = useState("");
  const loadDishes = useCallback(() => adminService.dishes({ categoryId: categoryId ? Number(categoryId) : undefined, isAvailable: availability === "" ? undefined : availability === "true" }), [categoryId, availability]);
  const loadCategories = useCallback(() => adminService.categories(), []);
  const dishes = useApiResource<AdminDishDto[]>(loadDishes);
  const categories = useApiResource<CategoryDto[]>(loadCategories);
  const [editing, setEditing] = useState<AdminDishDto | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<AdminDishDto | null>(null);
  const [saving, setSaving] = useState(false);
  const availabilityRequest = useRef(new Set<number>());
  const filtered = useMemo(() => (dishes.data ?? []).filter((dish) => dish.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))), [dishes.data, query]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setSaving(true);
    try {
      await adminService.saveDish({ categoryId: Number(form.get("categoryId")), name: String(form.get("name") ?? "").trim(), description: String(form.get("description") ?? "").trim() || null, price: Number(form.get("price")), cost: Number(form.get("cost")), isAvailable: form.get("isAvailable") === "on" }, editing?.id);
      toast.success(editing ? "Plato actualizado" : "Plato creado"); setEditing(undefined); await dishes.reload();
    } catch (cause) { toast.error("No se pudo guardar el plato", { description: getApiErrorMessage(cause, "Revisa los campos e inténtalo nuevamente.") }); }
    finally { setSaving(false); }
  }

  async function changeAvailability(dish: AdminDishDto) {
    if (availabilityRequest.current.has(dish.id)) return;
    availabilityRequest.current.add(dish.id);
    setSaving(true);
    try {
      const updated = await adminService.setDishAvailability(dish.id, !dish.isAvailable);
      dishes.setData((current) => current?.map((item) => item.id === updated.id ? updated : item) ?? current);
      toast.success(updated.isAvailable ? "Plato disponible" : "Plato desactivado");
    }
    catch (cause) {
      if (!axios.isAxiosError(cause) || cause.response?.status !== 403)
        toast.error("No se pudo cambiar la disponibilidad", { description: getApiErrorMessage(cause, "Inténtalo nuevamente.") });
    }
    finally { availabilityRequest.current.delete(dish.id); setSaving(false); }
  }

  async function remove() {
    if (!deleting) return; setSaving(true);
    try { await adminService.deleteDish(deleting.id); toast.success("Plato eliminado"); setDeleting(null); await dishes.reload(); }
    catch (cause) { toast.error("No se pudo eliminar el plato", { description: getApiErrorMessage(cause, "Puede tener historial de pedidos. Puedes desactivarlo en su lugar.") }); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <PageTitle title="Platos" description="Gestiona la carta, precios y disponibilidad." actions={<button className="button-primary" onClick={() => setEditing(null)} type="button"><Plus size={17} />Nuevo plato</button>} />
    <div className="flex flex-wrap items-end gap-3"><SearchInput label="Buscar" value={query} onChange={setQuery} placeholder="Buscar por nombre" /><div className="w-full sm:w-56"><SelectField label="Categoría" value={categoryId} onChange={setCategoryId}><option value="">Todas las categorías</option>{(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField></div><div className="w-full sm:w-48"><SelectField label="Disponibilidad" value={availability} onChange={setAvailabilityFilter}><option value="">Todos</option><option value="true">Disponible</option><option value="false">No disponible</option></SelectField></div></div>
    {(dishes.loading || categories.loading) && <LoadingState label="Cargando carta" />}{(dishes.error || categories.error) && <ErrorState message={dishes.error ?? categories.error ?? "Error al cargar datos."} onRetry={() => { void dishes.reload(); void categories.reload(); }} />}
    {!dishes.loading && !dishes.error && <DataTable rows={filtered} rowKey={(row) => row.id} emptyTitle="No hay platos" emptyDescription="No se encontraron platos con los filtros seleccionados." columns={[
      { key: "dish", title: "Plato", render: (row) => <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal"><CookingPot size={19} /></span><div><p className="font-semibold text-navy">{row.name}</p><p className="text-xs text-slate-400">{row.categoryName}</p></div></div> },
      { key: "price", title: "Precio", render: (row) => formatCurrency(row.price) },
      { key: "cost", title: "Costo", render: (row) => formatCurrency(row.cost) },
      { key: "margin", title: "Margen bruto unitario", render: (row) => <span className="font-semibold text-teal">{formatCurrency(row.price - row.cost)}</span> },
      { key: "status", title: "Estado", render: (row) => <StatusBadge tone={row.isAvailable ? "success" : "neutral"}>{row.isAvailable ? "Disponible" : "No disponible"}</StatusBadge> },
      { key: "actions", title: "Acciones", className: "text-right", render: (row) => <div className="flex justify-end gap-1"><button aria-label={`Editar ${row.name}`} className="button-quiet" onClick={() => setEditing(row)} type="button"><Pencil size={16} /></button><button aria-label={row.isAvailable ? `Desactivar ${row.name}` : `Activar ${row.name}`} className="button-quiet" disabled={saving} onClick={() => void changeAvailability(row)} type="button"><Power size={16} /></button><button aria-label={`Eliminar ${row.name}`} className="button-quiet text-rose-600" onClick={() => setDeleting(row)} type="button"><Trash2 size={16} /></button></div> },
    ]} />}
    {editing !== undefined && <DishForm initial={editing} categories={categories.data ?? []} saving={saving} onClose={() => setEditing(undefined)} onSubmit={save} />}
    {deleting && <ConfirmDialog title="Eliminar plato" description={`¿Eliminar “${deleting.name}”? Si tiene historial de pedidos, la API impedirá eliminarlo; puedes desactivarlo.`} loading={saving} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} confirmLabel="Eliminar plato" />}
  </div>;
}

function DishForm({ initial, categories, saving, onClose, onSubmit }: { initial: AdminDishDto | null; categories: CategoryDto[]; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={initial ? "Editar plato" : "Nuevo plato"} description="Precios, costos y reglas de validación se confirman en la API." onClose={onClose}><Form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Nombre<input className="field-input mt-2 block" defaultValue={initial?.name ?? ""} maxLength={140} name="name" required /></label>
    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Descripción<textarea className="field-input mt-2 block min-h-24 resize-y" defaultValue={initial?.description ?? ""} maxLength={500} name="description" rows={3} /></label>
    <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Categoría<select className="field-input mt-2 block" defaultValue={initial?.categoryId ?? ""} name="categoryId" required><option disabled value="">Selecciona categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? "" : " (inactiva)"}</option>)}</select></label>
    <label className="block text-sm font-semibold text-slate-700">Precio de venta<input className="field-input mt-2 block" defaultValue={initial?.price ?? ""} min="0.01" name="price" required step="0.01" type="number" /></label>
    <label className="block text-sm font-semibold text-slate-700">Costo<input className="field-input mt-2 block" defaultValue={initial?.cost ?? ""} min="0" name="cost" required step="0.01" type="number" /></label>
    <label className="flex items-center gap-3 text-sm font-medium text-slate-700 sm:col-span-2"><input className="size-4 accent-teal" defaultChecked={initial?.isAvailable ?? true} name="isAvailable" type="checkbox" />Disponible para venta</label>
    <div className="sm:col-span-2"><FormActions loading={saving} onCancel={onClose} submitLabel={initial ? "Guardar cambios" : "Crear plato"} /></div>
  </Form></Modal>;
}
