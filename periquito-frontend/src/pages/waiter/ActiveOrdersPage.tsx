import { useCallback } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { restaurantService } from "../../services/restaurantService";
import type { OrderResponse } from "../../types/api";
import { formatCurrency } from "../../utils/format";

export function ActiveOrdersPage() {
  const load = useCallback(() => restaurantService.getActiveOrders(), []);
  const { data, loading, error, reload } = useApiResource<OrderResponse[]>(load);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-teal">En servicio</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Pedidos activos</h2><p className="mt-1 text-sm text-slate-500">Consulta los pedidos abiertos en este momento.</p></div><button className="button-secondary" disabled={loading} onClick={() => void reload()} type="button"><RefreshCw size={16} />Actualizar</button></div>
    {loading && <LoadingState label="Consultando pedidos" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && data && (data.length ? <div className="grid gap-4 lg:grid-cols-2">{data.map((order) => <article className="surface-card overflow-hidden" key={order.id}><div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pedido #{order.id}</p><h3 className="mt-1 font-bold text-navy">{order.tableNumber ? `Mesa ${order.tableNumber}` : "Para llevar"}</h3></div><span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">{order.status}</span></div><div className="space-y-3 px-5 py-4">{order.details.map((detail) => <div className="flex items-start justify-between gap-3 text-sm" key={detail.id}><span className="text-slate-600">{detail.quantity} × {detail.dishName}</span><span className="shrink-0 font-medium text-navy">{formatCurrency(detail.subtotal)}</span></div>)}{!order.details.length && <p className="text-sm text-slate-400">El pedido todavía no tiene detalles.</p>}</div><div className="flex items-center justify-between bg-slate-50 px-5 py-3 text-sm"><span className="flex items-center gap-2 text-slate-500"><ClipboardList size={15} />Atiende {order.waiterUsername}</span><span className="font-bold text-navy">{formatCurrency(order.total)}</span></div></article>)}</div> : <EmptyState title="No hay pedidos activos" description="Cuando se registren pedidos abiertos, aparecerán en esta sección." />)}
  </div>;
}
