import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, FileDown, Minus, Plus, Printer, ReceiptText, Search, ShoppingBag, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog, Modal, SelectField, StatusBadge } from "../../components/admin/AdminUi";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { useAuth } from "../../context/AuthContext";
import { SaleTicket } from "../../components/tickets/SaleTicket";
import type { SaleTicketData } from "../../components/tickets/SaleTicket";
import { getApiErrorMessage } from "../../services/api";
import { restaurantService } from "../../services/restaurantService";
import type { CategoryResponse, DishResponse, OrderResponse } from "../../types/api";
import { formatCurrency, formatPeruDateTime } from "../../utils/format";

export function OrderDetailPage() {
  const { id: orderIdParam } = useParams();
  const orderId = Number(orderIdParam);
  const navigate = useNavigate();
  const { user } = useAuth();
  const loadOrder = useCallback(() => restaurantService.getOrder(orderId), [orderId]);
  const loadDishes = useCallback(() => restaurantService.getDishes(), []);
  const loadCategories = useCallback(() => restaurantService.getCategories(), []);
  const orderResource = useApiResource<OrderResponse>(loadOrder);
  const dishesResource = useApiResource<DishResponse[]>(loadDishes);
  const categoriesResource = useApiResource<CategoryResponse[]>(loadCategories);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<"cancel" | "complete" | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [completedSale, setCompletedSale] = useState<SaleTicketData | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [autoPrintTicket, setAutoPrintTicket] = useState(false);
  const requestLock = useRef(false);

  const dishes = useMemo(() => (dishesResource.data ?? []).filter((dish) =>
    (!categoryId || dish.categoryId === Number(categoryId))
    && dish.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))),
  [dishesResource.data, categoryId, query]);
  const order = orderResource.data;

  async function mutate(action: () => Promise<OrderResponse>, successMessage?: string) {
    if (requestLock.current) return;
    requestLock.current = true;
    setPending(true);
    try {
      const updated = await action();
      orderResource.setData(updated);
      if (successMessage) toast.success(successMessage);
    } catch (cause) {
      toast.error("No se pudo actualizar el pedido", { description: getApiErrorMessage(cause, "Actualiza el pedido e inténtalo nuevamente.") });
    } finally {
      requestLock.current = false;
      setPending(false);
    }
  }

  async function cancelOrder() {
    if (requestLock.current || !order) return;
    requestLock.current = true;
    setPending(true);
    try {
      await restaurantService.cancelOrder(order.id);
      toast.success(`Pedido #${order.id} cancelado. Mesa liberada.`);
      navigate("/mesero/mesas", { replace: true });
    } catch (cause) {
      toast.error("No se pudo cancelar el pedido", { description: getApiErrorMessage(cause, "Actualiza el pedido e inténtalo nuevamente.") });
    } finally {
      requestLock.current = false;
      setPending(false);
      setConfirmation(null);
    }
  }

  async function completeOrder() {
    if (requestLock.current || !order || !order.details.length) return;
    const received = cashReceived.trim() ? Number(cashReceived) : null;
    if (received !== null && (!Number.isFinite(received) || received < order.total)) return;
    requestLock.current = true;
    setPending(true);
    try {
      const sale = await restaurantService.completeOrder(order.id);
      setCompletedSale({
        saleId: sale.id,
        orderId: sale.orderId,
        tableNumber: order.tableNumber,
        waiterName: user?.fullName || user?.username || order.waiterUsername,
        soldAt: sale.soldAt,
        totalAmount: sale.totalAmount,
        details: order.details.map(({ dishName, quantity, unitPrice, subtotal }) => ({ dishName, quantity, unitPrice, subtotal })),
      });
    } catch (cause) {
      toast.error("No se pudo finalizar el pedido", { description: getApiErrorMessage(cause, "Comprueba que el pedido siga activo e inténtalo nuevamente.") });
      await orderResource.reload();
    } finally {
      requestLock.current = false;
      setPending(false);
      setConfirmation(null);
    }
  }

  if (!Number.isSafeInteger(orderId) || orderId <= 0) return <ErrorState message="El número de pedido no es válido." onRetry={() => navigate("/mesero/mesas")} />;
  if (orderResource.loading && !order) return <LoadingState label="Cargando pedido" />;
  if (orderResource.error || !order) return <ErrorState message={orderResource.error ?? "No se encontró el pedido."} onRetry={() => void orderResource.reload()} />;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><button className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-500 hover:text-navy" onClick={() => navigate("/mesero/pedidos")} type="button"><ArrowLeft size={17} />Pedidos activos</button><p className="text-sm font-medium text-teal">Atención de mesa {order.tableNumber ?? "—"}</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Pedido #{order.id}</h2><p className="mt-1 text-sm text-slate-500">Iniciado {formatPeruDateTime(order.orderedAt)}</p></div><StatusBadge tone="info">{statusLabel(order.status)}</StatusBadge></div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_250px]"><label className="block text-sm font-semibold text-slate-700">Buscar plato<span className="relative mt-2 block"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="field-input block !pl-11" onChange={(event) => setQuery(event.target.value)} placeholder="Nombre del plato" value={query} /></span></label><SelectField label="Categoría" value={categoryId} onChange={setCategoryId}><option value="">Todas las categorías</option>{(categoriesResource.data ?? []).filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField></div>
        {dishesResource.loading && <LoadingState label="Cargando carta disponible" />}{dishesResource.error && <ErrorState message={dishesResource.error} onRetry={() => void dishesResource.reload()} />}
        {!dishesResource.loading && !dishesResource.error && (dishes.length ? <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{dishes.map((dish) => <DishCard dish={dish} disabled={pending} key={dish.id} onAdd={() => void mutate(() => restaurantService.addOrderItem(order.id, dish.id))} />)}</div> : <EmptyState title="No se encontraron platos" description="Prueba otro nombre o categoría. Solo aparecen platos disponibles." />)}
      </section>
      <aside className="surface-card overflow-hidden xl:sticky xl:top-5"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mesa {order.tableNumber ?? "Para llevar"}</p><h3 className="mt-1 text-lg font-bold text-navy">Detalle del pedido</h3></div><span className="grid size-10 place-items-center rounded-xl bg-teal/10 text-teal"><ShoppingBag size={19} /></span></header>
        <div className="max-h-[52vh] space-y-4 overflow-y-auto p-4 sm:p-5">{order.details.length ? order.details.map((detail) => <div className="rounded-xl border border-slate-100 p-3" key={detail.id}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold text-navy">{detail.dishName}</p><p className="mt-1 text-xs text-slate-500">{formatCurrency(detail.unitPrice)} por unidad</p></div><button aria-label={`Retirar ${detail.dishName}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50" disabled={pending} onClick={() => void mutate(() => restaurantService.removeOrderItem(order.id, detail.dishId))} type="button"><Trash2 size={17} /></button></div><div className="mt-3 flex items-center justify-between gap-3"><div className="inline-flex items-center rounded-lg border border-slate-200"><button aria-label={`Disminuir ${detail.dishName}`} className="grid size-10 place-items-center text-navy hover:bg-slate-50 disabled:opacity-40" disabled={pending || detail.quantity <= 1} onClick={() => void mutate(() => restaurantService.setOrderItemQuantity(order.id, detail.dishId, detail.quantity - 1))} type="button"><Minus size={16} /></button><span className="min-w-10 text-center text-sm font-bold text-navy">{detail.quantity}</span><button aria-label={`Aumentar ${detail.dishName}`} className="grid size-10 place-items-center text-navy hover:bg-slate-50 disabled:opacity-40" disabled={pending || !(dishesResource.data ?? []).some((dish) => dish.id === detail.dishId)} onClick={() => void mutate(() => restaurantService.setOrderItemQuantity(order.id, detail.dishId, detail.quantity + 1))} type="button"><Plus size={16} /></button></div><span className="font-bold text-navy">{formatCurrency(detail.subtotal)}</span></div></div>) : <EmptyState title="Pedido vacío" description="Agrega platos desde la carta para comenzar." />}</div>
        <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><span className="font-semibold text-slate-600">Total</span><span className="text-2xl font-bold text-navy">{formatCurrency(order.total)}</span></div><div className="grid gap-2"><button className="button-primary min-h-12 w-full" disabled={pending || order.details.length === 0} onClick={() => { setCashReceived(""); setConfirmation("complete"); }} type="button"><Check size={17} />Finalizar y cobrar</button><button className="button-secondary min-h-11 w-full text-rose-700" disabled={pending} onClick={() => setConfirmation("cancel")} type="button"><X size={17} />Cancelar pedido</button></div><p className="mt-3 text-center text-xs text-slate-400">El importe de venta lo confirma el backend; el cálculo de efectivo es solo una ayuda.</p></div>
      </aside>
    </div>
    {confirmation === "cancel" && <ConfirmDialog title={`Cancelar pedido #${order.id}`} description="La mesa volverá a estar disponible. Esta acción no registra una venta." confirmLabel="Sí, cancelar pedido" loading={pending} onCancel={() => setConfirmation(null)} onConfirm={() => void cancelOrder()} />}
    {confirmation === "complete" && <Modal title="Finalizar pedido" description="Confirma el total. El cálculo de vuelto es opcional y no se guarda." onClose={() => !pending && setConfirmation(null)}><div className="mb-5 rounded-xl bg-teal/5 p-4 text-center"><p className="text-sm text-slate-500">Mesa {order.tableNumber} · Pedido #{order.id}</p><p className="mt-1 text-3xl font-bold text-navy">{formatCurrency(order.total)}</p></div><label className="mb-5 block text-sm font-semibold text-slate-700">Efectivo recibido (opcional)<input className="field-input mt-2 block" inputMode="decimal" min={order.total} onChange={(event) => setCashReceived(event.target.value)} placeholder="Ingresa el monto recibido" step="0.01" type="number" value={cashReceived} /></label>{cashReceived.trim() && <div className={`mb-5 rounded-xl p-4 text-sm ${Number(cashReceived) < order.total || !Number.isFinite(Number(cashReceived)) ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>{Number(cashReceived) < order.total || !Number.isFinite(Number(cashReceived)) ? <p>El efectivo recibido no puede ser menor que el total.</p> : <p className="flex justify-between"><span>Vuelto</span><strong>{formatCurrency(Math.round((Number(cashReceived) - order.total) * 100) / 100)}</strong></p>}</div>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary min-h-11" disabled={pending} onClick={() => setConfirmation(null)} type="button">Volver</button><button className="button-primary min-h-11" disabled={pending || order.details.length === 0 || Boolean(cashReceived.trim() && (Number(cashReceived) < order.total || !Number.isFinite(Number(cashReceived))))} onClick={() => void completeOrder()} type="button">{pending ? "Registrando venta…" : "Confirmar y finalizar"}</button></div></Modal>}
    {completedSale && !showTicket && <Modal title={`Venta #${completedSale.saleId} registrada`} description="El pedido se cerró correctamente. ¿Qué deseas hacer con el ticket interno?" onClose={() => { setCompletedSale(null); navigate("/mesero/mesas", { replace: true }); }}><div className="mb-5 rounded-2xl bg-[#EAF7F6] p-5 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-teal"><ReceiptText size={23} /></span><p className="mt-3 text-sm text-slate-600">Mesa {completedSale.tableNumber ?? "Para llevar"} · Pedido #{completedSale.orderId}</p><p className="mt-1 text-3xl font-extrabold text-navy">{formatCurrency(completedSale.totalAmount)}</p></div><div className="grid gap-2 sm:grid-cols-2"><button className="button-primary min-h-11" onClick={() => setShowTicket(true)} type="button"><ReceiptText size={17} />Ver ticket</button><button className="button-secondary min-h-11" onClick={() => { setAutoPrintTicket(true); setShowTicket(true); }} type="button"><Printer size={17} />Imprimir ticket</button><button className="button-secondary min-h-11" onClick={() => { setAutoPrintTicket(true); setShowTicket(true); }} type="button"><FileDown size={17} />Guardar como PDF</button><button className="button-quiet min-h-11" onClick={() => { setCompletedSale(null); navigate("/mesero/mesas", { replace: true }); }} type="button">Regresar a mesas</button></div></Modal>}
    {showTicket && completedSale && <SaleTicket autoPrint={autoPrintTicket} onClose={() => { setShowTicket(false); setAutoPrintTicket(false); }} onBackToTables={() => { setShowTicket(false); setCompletedSale(null); navigate("/mesero/mesas", { replace: true }); }} ticket={completedSale} />}
  </div>;
}

function DishCard({ dish, disabled, onAdd }: { dish: DishResponse; disabled: boolean; onAdd: () => void }) {
  return <article className="surface-card flex min-h-48 flex-col p-4 sm:p-5"><span className="grid size-10 place-items-center rounded-xl bg-teal/10 text-teal"><UtensilsCrossed size={19} /></span><p className="mt-3 text-xs font-bold uppercase tracking-wide text-teal">{dish.categoryName}</p><h3 className="mt-1 text-base font-bold text-navy">{dish.name}</h3>{dish.description && <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">{dish.description}</p>}<div className="mt-auto flex items-end justify-between gap-3 pt-4"><span className="text-lg font-bold text-navy">{formatCurrency(dish.price)}</span><button className="button-primary min-h-11 px-3" disabled={disabled || !dish.isAvailable} onClick={onAdd} type="button"><Plus size={17} />Agregar</button></div></article>;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = { Abierto: "Abierto", EnPreparacion: "En preparación", Listo: "Listo", Entregado: "Entregado" };
  return labels[status] ?? status;
}
