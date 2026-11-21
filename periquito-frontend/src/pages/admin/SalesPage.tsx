import { useCallback, useMemo, useState } from "react";
import { ArrowUpRight, Banknote, CircleDollarSign, Coins, Eye } from "lucide-react";
import { DataTable, Modal, PageTitle } from "../../components/admin/AdminUi";
import { DateRangeControls, rangeForPreset, type DateRangeValue } from "../../components/admin/DateRangeControls";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MetricCard } from "../../components/MetricCard";
import { useApiResource } from "../../hooks/useApiResource";
import { adminService } from "../../services/adminService";
import type { DashboardResponse } from "../../types/api";
import type { SaleDto } from "../../types/admin";
import { formatCurrency, formatPeruDateTime, peruLocalDateTimeToUtc } from "../../utils/format";

interface SalesData { sales: SaleDto[]; dashboard: DashboardResponse }

export function SalesPage() {
  const [range, setRange] = useState<DateRangeValue>(() => rangeForPreset("week"));
  const load = useCallback(async (): Promise<SalesData> => {
    const salesParams = range.fromDate && range.toDate ? { fromUtc: peruLocalDateTimeToUtc(range.fromDate), toUtc: peruLocalDateTimeToUtc(range.toDate, true) } : {};
    const [sales, dashboard] = await Promise.all([adminService.sales(salesParams), adminService.dashboard(range)]);
    return { sales, dashboard };
  }, [range]);
  const { data, loading, error, reload } = useApiResource<SalesData>(load);
  const [selected, setSelected] = useState<SaleDto | null>(null);
  const rows = useMemo(() => data?.sales ?? [], [data]);

  return <div className="space-y-6">
    <PageTitle title="Ventas" description="Historial y resumen financiero consultados desde la API." />
    <DateRangeControls onApply={setRange} />
    {loading && <LoadingState label="Consultando ventas" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Ingresos del período" value={formatCurrency(data.dashboard.summary.revenue)} note={`${data.dashboard.summary.completedOrders} pedidos completados`} icon={Banknote} tone="teal" /><MetricCard label="Costos del período" value={formatCurrency(data.dashboard.summary.cost)} note="Resumen financiero de Dashboard API" icon={Coins} tone="amber" /><MetricCard label="Ganancia bruta" value={formatCurrency(data.dashboard.summary.grossProfit)} note="Valor devuelto por la API" icon={ArrowUpRight} tone="navy" /><MetricCard label="Ticket promedio" value={formatCurrency(data.dashboard.summary.averageTicket)} note="Período seleccionado" icon={CircleDollarSign} tone="blue" /></div>
      <DataTable rows={rows} rowKey={(sale) => sale.id} emptyTitle="Sin ventas en este período" emptyDescription="Prueba otro rango de fechas." columns={[
        { key: "sale", title: "Venta", render: (sale) => <span className="font-bold text-navy">#{sale.id}</span> },
        { key: "order", title: "Pedido", render: (sale) => `#${sale.orderId}` },
        { key: "date", title: "Fecha y hora (Perú)", render: (sale) => formatPeruDateTime(sale.soldAt) },
        { key: "table", title: "Mesa", render: (sale) => sale.tableNumber == null ? "—" : `Mesa ${sale.tableNumber}` },
        { key: "waiter", title: "Mesero", render: (sale) => sale.waiterName },
        { key: "revenue", title: "Ingresos", render: (sale) => <span className="font-semibold text-navy">{formatCurrency(sale.totalAmount)}</span> },
        { key: "cost", title: "Costo", render: (sale) => formatCurrency(sale.totalCost) },
        { key: "profit", title: "Ganancia bruta", render: (sale) => <span className="font-semibold text-teal">{formatCurrency(sale.grossProfit)}</span> },
        { key: "detail", title: "Detalle", className: "text-right", render: (sale) => <button aria-label={`Ver venta ${sale.id}`} className="button-quiet text-teal" onClick={() => setSelected(sale)} type="button"><Eye size={16} />Ver</button> },
      ]} />
    </>}
    {selected && <Modal title={`Venta #${selected.id}`} description={`Pedido #${selected.orderId}`} onClose={() => setSelected(null)} size="lg"><dl className="mb-6 space-y-4 text-sm"><Row label="Fecha y hora (Perú)" value={formatPeruDateTime(selected.soldAt)} /><Row label="Mesa" value={selected.tableNumber == null ? "Sin mesa asignada" : `Mesa ${selected.tableNumber}`} /><Row label="Mesero" value={selected.waiterName} /><Row label="Ingresos" value={formatCurrency(selected.totalAmount)} /><Row label="Costo histórico" value={formatCurrency(selected.totalCost)} /><Row label="Ganancia bruta" value={formatCurrency(selected.grossProfit)} /></dl><h4 className="mb-3 font-bold text-navy">Platos vendidos</h4><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Plato</th><th className="px-4 py-3">Cantidad</th><th className="px-4 py-3">Precio unitario</th><th className="px-4 py-3">Subtotal</th></tr></thead><tbody>{selected.details.map((detail) => <tr className="border-t border-slate-100" key={detail.dishId}><td className="px-4 py-3 font-medium text-navy">{detail.dishName}</td><td className="px-4 py-3">{detail.quantity}</td><td className="px-4 py-3">{formatCurrency(detail.unitPrice)}</td><td className="px-4 py-3 font-semibold">{formatCurrency(detail.subtotal)}</td></tr>)}</tbody></table></div></Modal>}
  </div>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-navy">{value}</dd></div>; }
