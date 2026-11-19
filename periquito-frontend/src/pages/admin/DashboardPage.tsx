import { useCallback } from "react";
import { ArrowUpRight, Banknote, CircleDollarSign, ClipboardCheck, Coins, RefreshCw, Table2, Utensils } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MetricCard } from "../../components/MetricCard";
import { useApiResource } from "../../hooks/useApiResource";
import { dashboardService } from "../../services/dashboardService";
import type { DashboardResponse } from "../../types/api";
import { formatCurrency, formatShortDate } from "../../utils/format";

export function DashboardPage() {
  const load = useCallback(() => dashboardService.getDashboard(), []);
  const { data, loading, error, reload } = useApiResource<DashboardResponse>(load);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-medium text-teal">Resumen del negocio</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Dashboard</h2><p className="mt-1 text-sm text-slate-500">Indicadores consultados desde la operación real.</p></div>
      <button className="button-secondary" disabled={loading} onClick={() => void reload()} type="button"><RefreshCw className={loading ? "animate-spin" : ""} size={16} />Actualizar</button>
    </div>
    {loading && <LoadingState label="Cargando indicadores" />}
    {error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ventas" value={formatCurrency(data.summary.revenue)} note={`${data.summary.completedOrders} pedidos completados`} icon={Banknote} tone="teal" />
        <MetricCard label="Ganancia bruta" value={formatCurrency(data.summary.grossProfit)} note="En el período consultado" icon={ArrowUpRight} tone="navy" />
        <MetricCard label="Costo de ventas" value={formatCurrency(data.summary.cost)} note="Costo de productos vendidos" icon={Coins} tone="amber" />
        <MetricCard label="Ticket promedio" value={formatCurrency(data.summary.averageTicket)} note="Por pedido completado" icon={CircleDollarSign} tone="blue" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="surface-card p-5 sm:p-6">
          <div className="mb-5"><h3 className="font-bold text-navy">Ventas por día</h3><p className="mt-1 text-xs text-slate-500">Ingresos y ganancia bruta · datos reales</p></div>
          {data.dailySales.length ? <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={data.dailySales} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#e8edf1" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickFormatter={(value: number) => `S/ ${value}`} tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label) => formatShortDate(String(label))} />
              <Line type="monotone" dataKey="revenue" name="Ventas" stroke="#089B9A" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="grossProfit" name="Ganancia" stroke="#F59E0B" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart></ResponsiveContainer>
          </div> : <EmptyState title="Sin ventas en el período" description="El gráfico aparecerá cuando la API reporte ventas completadas." />}
        </section>
        <section className="surface-card p-5 sm:p-6">
          <div className="mb-5"><h3 className="font-bold text-navy">Estado actual</h3><p className="mt-1 text-xs text-slate-500">Información del restaurante</p></div>
          <div className="space-y-3">
            <StatusRow icon={Table2} label="Mesas disponibles" value={data.currentStatus.availableTables} />
            <StatusRow icon={Table2} label="Mesas ocupadas" value={data.currentStatus.occupiedTables} />
            <StatusRow icon={ClipboardCheck} label="Pedidos activos" value={data.currentStatus.activeOrders} />
            <StatusRow icon={Utensils} label="Insumos con stock bajo" value={data.currentStatus.lowStockIngredients} />
          </div>
        </section>
      </div>
      <section className="surface-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h3 className="font-bold text-navy">Platos más vendidos</h3><p className="mt-1 text-xs text-slate-500">Según los datos disponibles para el período</p></div>
        {data.topFiveDishes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Plato</th><th className="px-5 py-3 font-semibold">Unidades</th><th className="px-5 py-3 font-semibold">Ventas</th><th className="px-5 py-3 font-semibold">Ganancia</th></tr></thead><tbody>{data.topFiveDishes.map((dish) => <tr className="border-t border-slate-100" key={dish.dishId}><td className="px-5 py-4 font-semibold text-navy">{dish.dishName}</td><td className="px-5 py-4 text-slate-600">{dish.quantitySold}</td><td className="px-5 py-4 text-slate-600">{formatCurrency(dish.revenue)}</td><td className="px-5 py-4 font-semibold text-teal">{formatCurrency(dish.grossProfit)}</td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title="Aún no hay platos vendidos" description="Los resultados se mostrarán cuando existan pedidos completados." /></div>}
      </section>
    </>}
  </div>;
}

function StatusRow({ icon: Icon, label, value }: { icon: typeof Table2; label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="flex items-center gap-3 text-sm text-slate-600"><Icon className="text-teal" size={18} />{label}</span><span className="text-lg font-bold text-navy">{value}</span></div>;
}
