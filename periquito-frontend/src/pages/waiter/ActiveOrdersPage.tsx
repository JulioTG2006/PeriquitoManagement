import { useCallback, useMemo, useState } from "react";
import { ArrowRight, ClipboardList, RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { StatusBadge } from "../../components/admin/AdminUi";
import { useApiResource } from "../../hooks/useApiResource";
import { restaurantService } from "../../services/restaurantService";
import type { OrderResponse } from "../../types/api";
import { formatCurrency, formatPeruDateTime } from "../../utils/format";

export function ActiveOrdersPage() {
  const navigate = useNavigate();
  const load = useCallback(() => restaurantService.getActiveOrders(), []);
  const { data, loading, error, reload } = useApiResource<OrderResponse[]>(load);
  const [query, setQuery] = useState("");
  const orders = useMemo(() => (data ?? []).filter((order) =>
    String(order.id).includes(query.trim()) || String(order.tableNumber ?? "").includes(query.trim())), [data, query]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-teal">En servicio</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Pedidos activos</h2><p className="mt-1 text-sm text-slate-500">Abre cualquier pedido para continuar la atención.</p></div><button className="button-secondary min-h-11" disabled={loading} onClick={() => void reload()} type="button"><RefreshCw size={16} />Actualizar</button></div>
    <label className="block max-w-md text-sm font-semibold text-slate-700">Buscar pedido o mesa<span className="relative mt-2 block"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="field-input block !pl-11" onChange={(event) => setQuery(event.target.value)} placeholder="Número de pedido o mesa" value={query} /></span></label>
    {loading && <LoadingState label="Consultando pedidos" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && (orders.length ? <div className="grid gap-4 lg:grid-cols-2">{orders.map((order) => <article className="surface-card overflow-hidden" key={order.id}><header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pedido #{order.id}</p><h3 className="mt-1 text-lg font-bold text-navy">{order.tableNumber ? `Mesa ${order.tableNumber}` : "Para llevar"}</h3></div><StatusBadge tone="info">{statusLabel(order.status)}</StatusBadge></header><div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-slate-400">Fecha de apertura</p><p className="mt-1 font-medium text-navy">{formatPeruDateTime(order.orderedAt)}</p></div><div><p className="text-xs font-semibold uppercase text-slate-400">Platos</p><p className="mt-1 font-medium text-navy">{order.details.reduce((total, detail) => total + detail.quantity, 0)} unidades</p></div></div><div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4"><div><p className="flex items-center gap-2 text-xs text-slate-500"><ClipboardList size={15} />Total del pedido</p><p className="mt-1 text-lg font-bold text-navy">{formatCurrency(order.total)}</p></div><button className="button-primary min-h-11" onClick={() => navigate(`/mesero/pedidos/${order.id}`)} type="button">Continuar <ArrowRight size={16} /></button></div></article>)}</div> : <EmptyState title={query ? "No hay coincidencias" : "No hay pedidos activos"} description={query ? "Prueba con otro número de pedido o mesa." : "Cuando se registren pedidos abiertos, aparecerán aquí."} />)}
  </div>;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = { Abierto: "Abierto", EnPreparacion: "En preparación", Listo: "Listo", Entregado: "Entregado" };
  return labels[status] ?? status;
}
