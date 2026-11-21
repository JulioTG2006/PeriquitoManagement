import { useCallback, useState, type FormEvent } from "react";
import { Armchair, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, Form, FormActions, Modal, PageTitle, SelectField, StatusBadge } from "../../components/admin/AdminUi";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { adminService } from "../../services/adminService";
import { getApiErrorMessage } from "../../services/api";
import type { AdminOrderDto, TableDto } from "../../types/admin";
import { formatCurrency, formatPeruDateTime } from "../../utils/format";

export function TablesPage() {
  const [status, setStatus] = useState("");
  const load = useCallback(() => adminService.tables(status || undefined), [status]);
  const { data, loading, error, reload } = useApiResource<TableDto[]>(load);
  const [editing, setEditing] = useState<TableDto | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<TableDto | null>(null);
  const [activeOrder, setActiveOrder] = useState<AdminOrderDto | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setSaving(true);
    try { await adminService.saveTable({ tableNumber: Number(form.get("tableNumber")), capacity: Number(form.get("capacity")) }, editing?.id); toast.success(editing ? "Mesa actualizada" : "Mesa creada"); setEditing(undefined); await reload(); }
    catch (cause) { toast.error("No se pudo guardar la mesa", { description: getApiErrorMessage(cause, "Revisa el número y la capacidad.") }); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!deleting) return; setSaving(true);
    try { await adminService.deleteTable(deleting.id); toast.success("Mesa eliminada"); setDeleting(null); await reload(); }
    catch (cause) { toast.error("No se pudo eliminar la mesa", { description: getApiErrorMessage(cause, "La mesa puede tener pedidos asociados.") }); }
    finally { setSaving(false); }
  }

  async function viewOrder(table: TableDto) {
    try { setActiveOrder(await adminService.activeOrderForTable(table.id)); }
    catch (cause) { toast.error("No se pudo consultar el pedido", { description: getApiErrorMessage(cause, "La mesa no tiene un pedido activo o no se pudo cargar.") }); }
  }

  return <div className="space-y-6">
    <PageTitle title="Mesas" description="Consulta disponibilidad y administra número y capacidad." actions={<button className="button-primary" onClick={() => setEditing(null)} type="button"><Plus size={17} />Nueva mesa</button>} />
    <div className="w-full sm:max-w-xs"><SelectField label="Estado" value={status} onChange={setStatus}><option value="">Todas las mesas</option><option value="Disponible">Disponibles</option><option value="Ocupada">Ocupadas</option></SelectField></div>
    {loading && <LoadingState label="Cargando mesas" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && data && (data.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((table) => {
      const available = table.status === "Disponible";
      return <article className="surface-card p-5" key={table.id}><div className="flex items-start justify-between"><span className={`grid size-12 place-items-center rounded-2xl ${available ? "bg-teal/10 text-teal" : "bg-amber/15 text-amber-700"}`}><Armchair size={22} /></span><StatusBadge tone={available ? "success" : "warning"}>{table.status}</StatusBadge></div><div className="mt-5 flex items-end justify-between gap-3"><div><h3 className="text-xl font-bold text-navy">Mesa {table.tableNumber}</h3><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><UsersRound size={16} />Capacidad {table.capacity}</p></div><div className="flex gap-1">{!available && <button aria-label={`Consultar pedido de mesa ${table.tableNumber}`} className="button-quiet text-teal" onClick={() => void viewOrder(table)} type="button">Pedido</button>}<button aria-label={`Editar mesa ${table.tableNumber}`} className="button-quiet" onClick={() => setEditing(table)} type="button"><Pencil size={16} /></button><button aria-label={`Eliminar mesa ${table.tableNumber}`} className="button-quiet text-rose-600" onClick={() => setDeleting(table)} type="button"><Trash2 size={16} /></button></div></div></article>;
    })}</div> : <EmptyState title="No hay mesas" description="No hay mesas que coincidan con este filtro." />)}
    {editing !== undefined && <TableForm initial={editing} saving={saving} onClose={() => setEditing(undefined)} onSubmit={save} />}
    {deleting && <ConfirmDialog title="Eliminar mesa" description={`¿Eliminar la mesa ${deleting.tableNumber}? La API rechazará la acción si tiene historial de pedidos.`} loading={saving} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} confirmLabel="Eliminar mesa" />}
    {activeOrder && <Modal title={`Pedido activo · Mesa ${activeOrder.tableNumber ?? "—"}`} description={`Pedido #${activeOrder.id} · ${activeOrder.status} · ${formatPeruDateTime(activeOrder.orderedAt)}`} onClose={() => setActiveOrder(null)}><div className="space-y-3">{activeOrder.details.map((detail) => <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm" key={detail.id}><span className="text-slate-600">{detail.quantity} × {detail.dishName}</span><span className="font-semibold text-navy">{formatCurrency(detail.subtotal)}</span></div>)}<div className="flex justify-between border-t border-slate-100 pt-4 text-sm"><span>Total del pedido</span><strong className="text-navy">{formatCurrency(activeOrder.total)}</strong></div></div></Modal>}
  </div>;
}

function TableForm({ initial, saving, onClose, onSubmit }: { initial: TableDto | null; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={initial ? "Editar mesa" : "Registrar mesa"} description="El estado de ocupación se gestiona desde los pedidos." onClose={onClose}><Form onSubmit={onSubmit}><label className="block text-sm font-semibold text-slate-700">Número de mesa<input className="field-input mt-2 block" defaultValue={initial?.tableNumber ?? ""} min="1" name="tableNumber" required type="number" /></label><label className="block text-sm font-semibold text-slate-700">Capacidad<input className="field-input mt-2 block" defaultValue={initial?.capacity ?? ""} min="1" name="capacity" required type="number" /></label><FormActions loading={saving} onCancel={onClose} submitLabel={initial ? "Guardar cambios" : "Registrar mesa"} /></Form></Modal>;
}
