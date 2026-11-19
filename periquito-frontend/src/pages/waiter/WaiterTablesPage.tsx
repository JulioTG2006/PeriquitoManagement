import { useCallback } from "react";
import { Armchair, RefreshCw, UsersRound } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { restaurantService } from "../../services/restaurantService";
import type { TableResponse } from "../../types/api";

export function WaiterTablesPage() {
  const load = useCallback(() => restaurantService.getTables(), []);
  const { data, loading, error, reload } = useApiResource<TableResponse[]>(load);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-teal">Servicio</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Mesas</h2><p className="mt-1 text-sm text-slate-500">Consulta el estado de las mesas del restaurante.</p></div><button className="button-secondary" disabled={loading} onClick={() => void reload()} type="button"><RefreshCw size={16} />Actualizar</button></div>
    {loading && <LoadingState label="Consultando mesas" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && data && (data.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((table) => {
      const available = table.status.toLowerCase().includes("disponible");
      return <article className="surface-card p-5" key={table.id}><div className="flex items-start justify-between"><span className={`grid size-12 place-items-center rounded-2xl ${available ? "bg-teal/10 text-teal" : "bg-amber/15 text-amber-700"}`}><Armchair size={22} /></span><span className={`rounded-full px-3 py-1 text-xs font-bold ${available ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{table.status}</span></div><h3 className="mt-5 text-xl font-bold text-navy">Mesa {table.tableNumber}</h3><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><UsersRound size={16} />Capacidad para {table.capacity} personas</p></article>;
    })}</div> : <EmptyState title="No hay mesas registradas" description="No se encontraron mesas para mostrar." />)}
  </div>;
}
