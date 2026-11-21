import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Eye, Plus, ReceiptText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, Form, Modal, PageTitle, SelectField, StatusBadge } from "../../components/admin/AdminUi";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { adminService } from "../../services/adminService";
import { getApiErrorMessage } from "../../services/api";
import type { AdminDishDto, AdminOrderDto } from "../../types/admin";
import { formatCurrency, formatPeruDateTime } from "../../utils/format";

const activeStatuses = ["Abierto", "EnPreparacion", "Listo", "Entregado"];

export function OrdersPage() {
  const load = useCallback(() => adminService.orders(), []);
  const loadDishes = useCallback(() => adminService.dishes({ isAvailable: true }), []);
  const { data, loading, error, reload } = useApiResource<AdminOrderDto[]>(load);
  const dishes = useApiResource<AdminDishDto[]>(loadDishes);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<AdminOrderDto | null>(null);
  const [confirmAction, setConfirmAction] = useState<"cancel" | "complete" | null>(null);
  const [saving, setSaving] = useState(false);
  const rows = useMemo(() => (data ?? []).filter((order) => !status || order.status === status), [data, status]);

  async function openOrder(order: AdminOrderDto) {
    try { setSelected(await adminService.order(order.id)); }
    catch (cause) { toast.error("No se pudo cargar el pedido", { description: getApiErrorMessage(cause, "Inténtalo nuevamente.") }); }
  }

  async function finishAction() {
    if (!selected || !confirmAction) return;
    setSaving(true);
    try {
      if (confirmAction === "cancel") { await adminService.cancelOrder(selected.id); toast.success(`Pedido #${selected.id} cancelado`); }
      else { await adminService.completeOrder(selected.id); toast.success(`Venta del pedido #${selected.id} registrada`); }
      setConfirmAction(null); setSelected(null); await reload();
    } catch (cause) { toast.error(confirmAction === "cancel" ? "No se pudo cancelar el pedido" : "No se pudo finalizar el pedido", { description: getApiErrorMessage(cause, "La API rechazó la operación.") }); }
    finally { setSaving(false); }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; const form = new FormData(event.currentTarget); setSaving(true);
    try { setSelected(await adminService.addOrderItem(selected.id, Number(form.get("dishId")), Number(form.get("quantity")))); toast.success("Plato agregado al pedido"); await reload(); }
    catch (cause) { toast.error("No se pudo agregar el plato", { description: getApiErrorMessage(cause, "Revisa disponibilidad y cantidad.") }); }
    finally { setSaving(false); }
  }

  async function updateQuantity(event: FormEvent<HTMLFormElement>, dishId: number) {
    event.preventDefault(); if (!selected) return; const form = new FormData(event.currentTarget); setSaving(true);
    try { setSelected(await adminService.setOrderItemQuantity(selected.id, dishId, Number(form.get("quantity")))); toast.success("Cantidad actualizada"); await reload(); }
    catch (cause) { toast.error("No se pudo cambiar la cantidad", { description: getApiErrorMessage(cause, "Revisa el pedido e inténtalo nuevamente.") }); }
    finally { setSaving(false); }
  }

  async function removeItem(dishId: number) {
    if (!selected) return; setSaving(true);
    try { setSelected(await adminService.removeOrderItem(selected.id, dishId)); toast.success("Plato retirado del pedido"); await reload(); }
    catch (cause) { toast.error("No se pudo retirar el plato", { description: getApiErrorMessage(cause, "Inténtalo nuevamente.") }); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <PageTitle title="Pedidos" description="Consulta y gestiona pedidos y sus detalles." actions={<div className="w-full sm:w-52"><SelectField label="Estado" value={status} onChange={setStatus}><option value="">Todos los estados</option>{[...activeStatuses, "Cerrado", "Cancelado"].map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</SelectField></div>} />
    {loading && <LoadingState label="Cargando pedidos" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && <DataTable rows={rows} rowKey={(order) => order.id} emptyTitle="No hay pedidos" columns={[
      { key: "id", title: "Pedido", render: (order) => <span className="font-bold text-navy">#{order.id}</span> },
      { key: "table", title: "Mesa", render: (order) => order.tableNumber ? `Mesa ${order.tableNumber}` : "—" },
      { key: "waiter", title: "Mesero", render: (order) => order.waiterUsername },
      { key: "date", title: "Fecha", render: (order) => formatPeruDateTime(order.orderedAt) },
      { key: "status", title: "Estado", render: (order) => <StatusBadge tone={statusTone(order.status)}>{statusLabel(order.status)}</StatusBadge> },
      { key: "total", title: "Total", render: (order) => <span className="font-semibold text-navy">{formatCurrency(order.total)}</span> },
      { key: "view", title: "Detalle", className: "text-right", render: (order) => <button aria-label={`Ver pedido ${order.id}`} className="button-quiet text-teal" onClick={() => void openOrder(order)} type="button"><Eye size={17} />Ver</button> },
    ]} />}
    {selected && <Modal size="lg" title={`Pedido #${selected.id}`} description={`${selected.tableNumber ? `Mesa ${selected.tableNumber}` : "Sin mesa"} · ${selected.waiterUsername} · ${formatPeruDateTime(selected.orderedAt)}`} onClose={() => setSelected(null)}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><StatusBadge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</StatusBadge><div className="text-right"><p className="text-xs text-slate-400">Total registrado por la API</p><p className="text-lg font-bold text-navy">{formatCurrency(selected.total)}</p><p className="text-xs text-slate-500">Costo: {formatCurrency(selected.totalCost)}</p></div></div>
        <div className="space-y-3">{selected.details.length ? selected.details.map((detail) => <div className="rounded-xl border border-slate-100 p-4" key={detail.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-navy">{detail.dishName}</p><p className="mt-1 text-xs text-slate-500">Precio {formatCurrency(detail.unitPrice)} · costo {formatCurrency(detail.unitCost)} · subtotal {formatCurrency(detail.subtotal)}</p></div>{activeStatuses.includes(selected.status) && <div className="flex items-center gap-1"><Form onSubmit={(event) => void updateQuantity(event, detail.dishId)} className="flex items-center gap-2"><input aria-label={`Cantidad de ${detail.dishName}`} className="field-input w-20 px-2 text-center" defaultValue={detail.quantity} min="1" name="quantity" required type="number" /><button className="button-secondary px-3" disabled={saving} type="submit">Actualizar</button></Form><button aria-label={`Retirar ${detail.dishName}`} className="button-quiet text-rose-600" disabled={saving} onClick={() => void removeItem(detail.dishId)} type="button"><Trash2 size={16} /></button></div>}</div></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Este pedido no tiene platos.</p>}</div>
        {activeStatuses.includes(selected.status) && <Form onSubmit={addItem} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_110px_auto] sm:items-end"><label className="block text-sm font-semibold text-slate-700">Agregar plato<select className="field-input mt-2 block" defaultValue="" name="dishId" required><option disabled value="">Selecciona plato</option>{(dishes.data ?? []).map((dish) => <option key={dish.id} value={dish.id}>{dish.name} · {formatCurrency(dish.price)}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Cantidad<input className="field-input mt-2 block" defaultValue="1" min="1" name="quantity" required type="number" /></label><button className="button-primary" disabled={saving || dishes.loading} type="submit"><Plus size={16} />Agregar</button></Form>}
        {activeStatuses.includes(selected.status) && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between"><button className="button-secondary text-rose-700" onClick={() => setConfirmAction("cancel")} type="button">Cancelar pedido</button><button className="button-primary" disabled={!selected.details.length} onClick={() => setConfirmAction("complete")} type="button"><ReceiptText size={16} />Finalizar y registrar venta</button></div>}
      </div>
    </Modal>}
    {selected && confirmAction && <ConfirmDialog title={confirmAction === "cancel" ? "Cancelar pedido" : "Finalizar pedido"} description={confirmAction === "cancel" ? `Se cancelará el pedido #${selected.id}. La operación quedará registrada por la API.` : `Se registrará la venta del pedido #${selected.id} y se cerrará el servicio.`} confirmLabel={confirmAction === "cancel" ? "Sí, cancelar pedido" : "Sí, finalizar venta"} loading={saving} onCancel={() => setConfirmAction(null)} onConfirm={() => void finishAction()} />}
  </div>;
}

function statusLabel(status: string) { return ({ Abierto: "Abierto", EnPreparacion: "En preparación", Listo: "Listo", Entregado: "Entregado", Cerrado: "Cerrado", Cancelado: "Cancelado" } as Record<string, string>)[status] ?? status; }
function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" { if (status === "Cerrado") return "success"; if (status === "Cancelado") return "danger"; if (status === "Abierto") return "info"; if (activeStatuses.includes(status)) return "warning"; return "neutral"; }
