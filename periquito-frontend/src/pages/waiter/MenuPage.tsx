import { useCallback } from "react";
import { RefreshCw, UtensilsCrossed } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { restaurantService } from "../../services/restaurantService";
import type { DishResponse } from "../../types/api";
import { formatCurrency } from "../../utils/format";

export function MenuPage() {
  const load = useCallback(() => restaurantService.getDishes(), []);
  const { data, loading, error, reload } = useApiResource<DishResponse[]>(load);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-teal">Para compartir</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Carta de platos</h2><p className="mt-1 text-sm text-slate-500">Platos disponibles y sus precios de venta.</p></div><button className="button-secondary" disabled={loading} onClick={() => void reload()} type="button"><RefreshCw size={16} />Actualizar</button></div>
    {loading && <LoadingState label="Cargando carta" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && data && (data.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((dish) => <article className="surface-card flex min-h-48 flex-col p-5" key={dish.id}><span className="grid size-11 place-items-center rounded-2xl bg-teal/10 text-teal"><UtensilsCrossed size={20} /></span><p className="mt-4 text-xs font-bold uppercase tracking-wide text-teal">{dish.categoryName}</p><h3 className="mt-1 text-lg font-bold text-navy">{dish.name}</h3><p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-500">{dish.description || "Preparado por la cocina de Periquito."}</p><p className="mt-4 text-lg font-bold text-navy">{formatCurrency(dish.price)}</p></article>)}</div> : <EmptyState title="No hay platos disponibles" description="La carta no tiene platos marcados como disponibles." />)}
  </div>;
}
