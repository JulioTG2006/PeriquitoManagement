import { useCallback, useMemo, useState } from "react";
import { ArrowUpRight, Banknote, CalendarDays, CircleDollarSign, ClipboardCheck, Coins, RefreshCw, Table2, Utensils } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MetricCard } from "../../components/MetricCard";
import { DataTable, PageTitle, SelectField } from "../../components/admin/AdminUi";
import { useApiResource } from "../../hooks/useApiResource";
import { adminService } from "../../services/adminService";
import type { DashboardResponse } from "../../types/api";
import { dateOnlyPlusDays, formatCurrency, formatShortDate, peruDateOnly } from "../../utils/format";

type RangePreset = "today" | "week" | "month" | "custom" | "all";
type Range = { fromDate?: string; toDate?: string };

function rangeFor(preset: RangePreset, fromDate: string, toDate: string): Range {
  const today = peruDateOnly();
  if (preset === "today") return { fromDate: today, toDate: today };
  if (preset === "week") return { fromDate: dateOnlyPlusDays(today, -6), toDate: today };
  if (preset === "month") return { fromDate: `${today.slice(0, 7)}-01`, toDate: today };
  if (preset === "custom" && fromDate && toDate) return { fromDate, toDate };
  return {};
}

export function DashboardPage() {
  const [preset, setPreset] = useState<RangePreset>("week");
  const [customFrom, setCustomFrom] = useState(peruDateOnly());
  const [customTo, setCustomTo] = useState(peruDateOnly());
  const [appliedRange, setAppliedRange] = useState<Range>(() => rangeFor("week", "", ""));
  const load = useCallback(() => adminService.dashboard(appliedRange), [appliedRange]);
  const { data, loading, error, reload } = useApiResource<DashboardResponse>(load);
  const rangeLabel = useMemo(() => preset === "all" ? "Todas las ventas" : preset === "today" ? "Hoy · hora de Perú" : preset === "week" ? "Últimos 7 días · hora de Perú" : preset === "month" ? "Este mes · hora de Perú" : "Rango personalizado · hora de Perú", [preset]);

  function choosePreset(value: RangePreset) {
    setPreset(value);
    if (value !== "custom") setAppliedRange(rangeFor(value, customFrom, customTo));
  }

  function applyCustomRange() {
    if (!customFrom || !customTo || customFrom > customTo) return;
    setPreset("custom");
    setAppliedRange({ fromDate: customFrom, toDate: customTo });
  }

  return <div className="space-y-6">
    <PageTitle title="Dashboard" eyebrow="Resumen del negocio" description="Indicadores y actividad del restaurante." actions={<button className="button-secondary" disabled={loading} onClick={() => void reload()} type="button"><RefreshCw className={loading ? "animate-spin" : ""} size={16} />Actualizar</button>} />
    <section className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:p-5">
      <div className="w-full sm:max-w-xs"><SelectField label="Período de ventas" value={preset} onChange={(value) => choosePreset(value as RangePreset)}><option value="today">Hoy</option><option value="week">Últimos 7 días</option><option value="month">Este mes</option><option value="custom">Rango personalizado</option><option value="all">Todas las ventas</option></SelectField></div>
      {preset === "custom" && <div className="flex w-full flex-wrap items-end gap-3"><label className="flex-1 text-sm font-semibold text-slate-700">Desde<input className="field-input mt-2 block" max={customTo} onChange={(event) => setCustomFrom(event.target.value)} type="date" value={customFrom} /></label><label className="flex-1 text-sm font-semibold text-slate-700">Hasta<input className="field-input mt-2 block" min={customFrom} onChange={(event) => setCustomTo(event.target.value)} type="date" value={customTo} /></label><button className="button-primary" disabled={!customFrom || !customTo || customFrom > customTo} onClick={applyCustomRange} type="button"><CalendarDays size={16} />Aplicar</button></div>}
      <p className="text-xs text-slate-400 sm:ml-auto">{rangeLabel}</p>
    </section>
    {loading && <LoadingState label="Cargando indicadores" />}
    {error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Ingresos" value={formatCurrency(data.summary.revenue)} note="Ventas completadas" icon={Banknote} tone="teal" />
        <MetricCard label="Ganancia bruta" value={formatCurrency(data.summary.grossProfit)} note="Período seleccionado" icon={ArrowUpRight} tone="navy" />
        <MetricCard label="Costos totales" value={formatCurrency(data.summary.cost)} note="Costos de venta" icon={Coins} tone="amber" />
        <MetricCard label="Pedidos completados" value={String(data.summary.completedOrders)} note="Ventas registradas" icon={ClipboardCheck} tone="blue" />
        <MetricCard label="Ticket promedio" value={formatCurrency(data.summary.averageTicket)} note="Por venta completada" icon={CircleDollarSign} tone="teal" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="surface-card p-5 sm:p-6">
          <div className="mb-5"><h3 className="font-bold text-navy">Ingresos y ganancias por día</h3><p className="mt-1 text-xs text-slate-500">{rangeLabel}</p></div>
          {data.dailySales.length ? <div className="h-[290px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.dailySales} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid stroke="#e8edf1" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} fontSize={11} /><YAxis tickFormatter={(value: number) => `S/ ${value}`} tickLine={false} axisLine={false} fontSize={11} /><Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label) => formatShortDate(String(label))} /><Line type="monotone" dataKey="revenue" name="Ingresos" stroke="#089B9A" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="grossProfit" name="Ganancia bruta" stroke="#F59E0B" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div> : <EmptyState title="Sin ventas en el período" description="No hay ventas completadas para graficar en el rango seleccionado." />}
        </section>
        <section className="surface-card p-5 sm:p-6"><div className="mb-5"><h3 className="font-bold text-navy">Estado actual</h3><p className="mt-1 text-xs text-slate-500">Datos actuales del restaurante</p></div><div className="space-y-3"><StatusRow icon={Table2} label="Mesas disponibles" value={data.currentStatus.availableTables} /><StatusRow icon={Table2} label="Mesas ocupadas" value={data.currentStatus.occupiedTables} /><StatusRow icon={ClipboardCheck} label="Pedidos activos" value={data.currentStatus.activeOrders} /><StatusRow icon={Utensils} label="Insumos con stock bajo" value={data.currentStatus.lowStockIngredients} /></div></section>
      </div>
      <section className="space-y-4"><div><h3 className="text-lg font-bold text-navy">Cinco platos más vendidos</h3><p className="mt-1 text-sm text-slate-500">Ranking según ventas registradas en el período.</p></div><DataTable rows={data.topFiveDishes} rowKey={(dish) => dish.dishId} emptyTitle="Sin platos vendidos" emptyDescription="El ranking aparecerá al completar ventas." columns={[
        { key: "dish", title: "Plato", render: (dish) => <span className="font-semibold text-navy">{dish.dishName}</span> },
        { key: "quantity", title: "Unidades", render: (dish) => dish.quantitySold },
        { key: "revenue", title: "Ingresos", render: (dish) => formatCurrency(dish.revenue) },
        { key: "profit", title: "Ganancia bruta", render: (dish) => <span className="font-semibold text-teal">{formatCurrency(dish.grossProfit)}</span> },
      ]} /></section>
    </>}
  </div>;
}

function StatusRow({ icon: Icon, label, value }: { icon: typeof Table2; label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="flex items-center gap-3 text-sm text-slate-600"><Icon className="text-teal" size={18} />{label}</span><span className="text-lg font-bold text-navy">{value}</span></div>;
}
