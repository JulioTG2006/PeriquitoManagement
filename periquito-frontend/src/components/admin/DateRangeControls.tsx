import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { SelectField } from "./AdminUi";
import { dateOnlyPlusDays, peruDateOnly } from "../../utils/format";

export type DateRangeValue = { fromDate?: string; toDate?: string };
export type DateRangePreset = "today" | "week" | "month" | "custom" | "all";

export function rangeForPreset(preset: DateRangePreset, fromDate = peruDateOnly(), toDate = peruDateOnly()): DateRangeValue {
  const today = peruDateOnly();
  if (preset === "today") return { fromDate: today, toDate: today };
  if (preset === "week") return { fromDate: dateOnlyPlusDays(today, -6), toDate: today };
  if (preset === "month") return { fromDate: `${today.slice(0, 7)}-01`, toDate: today };
  if (preset === "custom" && fromDate && toDate) return { fromDate, toDate };
  return {};
}

export function DateRangeControls({ onApply, initialPreset = "week" }: { onApply: (range: DateRangeValue) => void; initialPreset?: DateRangePreset }) {
  const today = peruDateOnly();
  const [preset, setPreset] = useState<DateRangePreset>(initialPreset);
  const [fromDate, setFromDate] = useState(rangeForPreset(initialPreset).fromDate ?? today);
  const [toDate, setToDate] = useState(rangeForPreset(initialPreset).toDate ?? today);
  function changePreset(next: DateRangePreset) {
    setPreset(next);
    if (next !== "custom") onApply(rangeForPreset(next, fromDate, toDate));
  }
  function applyCustom() {
    if (fromDate && toDate && fromDate <= toDate) {
      setPreset("custom");
      onApply({ fromDate, toDate });
    }
  }
  return <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
    <div className="w-full sm:max-w-xs"><SelectField label="Período" value={preset} onChange={(value) => changePreset(value as DateRangePreset)}><option value="today">Hoy</option><option value="week">Últimos 7 días</option><option value="month">Este mes</option><option value="custom">Rango personalizado</option><option value="all">Todas las fechas</option></SelectField></div>
    {preset === "custom" && <div className="flex w-full flex-wrap items-end gap-3"><label className="flex-1 text-sm font-semibold text-slate-700">Desde<input className="field-input mt-2 block" max={toDate} onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} /></label><label className="flex-1 text-sm font-semibold text-slate-700">Hasta<input className="field-input mt-2 block" min={fromDate} onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} /></label><button className="button-primary" disabled={!fromDate || !toDate || fromDate > toDate} onClick={applyCustom} type="button"><CalendarDays size={16} />Aplicar</button></div>}
    <p className="text-xs text-slate-400 sm:ml-auto">Fechas de Perú · America/Lima</p>
  </div>;
}
