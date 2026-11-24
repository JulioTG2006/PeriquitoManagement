import { useCallback, useMemo, useState } from "react";
import { RefreshCw, Search, UtensilsCrossed } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { SelectField, StatusBadge } from "../../components/admin/AdminUi";
import { useApiResource } from "../../hooks/useApiResource";
import { restaurantService } from "../../services/restaurantService";
import type { CategoryResponse, DishResponse } from "../../types/api";
import { formatCurrency } from "../../utils/format";

export function MenuPage() {
  const loadDishes = useCallback(() => restaurantService.getDishes(), []);
  const loadCategories = useCallback(() => restaurantService.getCategories(), []);
  const dishesResource = useApiResource<DishResponse[]>(loadDishes);
  const categoriesResource = useApiResource<CategoryResponse[]>(loadCategories);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const dishes = useMemo(() => (dishesResource.data ?? []).filter((dish) =>
    (!categoryId || dish.categoryId === Number(categoryId))
    && dish.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))),
  [dishesResource.data, categoryId, query]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-teal">Para compartir</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Carta de platos</h2><p className="mt-1 text-sm text-slate-500">Consulta los platos disponibles y sus precios de venta.</p></div><button className="button-secondary min-h-11" disabled={dishesResource.loading || categoriesResource.loading} onClick={() => { void dishesResource.reload(); void categoriesResource.reload(); }} type="button"><RefreshCw size={16} />Actualizar</button></div>
    <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_250px]"><label className="block text-sm font-semibold text-slate-700">Buscar plato<span className="relative mt-2 block"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="field-input block !pl-11" onChange={(event) => setQuery(event.target.value)} placeholder="Nombre del plato" value={query} /></span></label><SelectField label="Categoría" value={categoryId} onChange={setCategoryId}><option value="">Todas las categorías</option>{(categoriesResource.data ?? []).filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField></div>
    {(dishesResource.loading || categoriesResource.loading) && <LoadingState label="Cargando carta disponible" />}{(dishesResource.error || categoriesResource.error) && <ErrorState message={dishesResource.error ?? categoriesResource.error ?? "No se pudo cargar la carta."} onRetry={() => { void dishesResource.reload(); void categoriesResource.reload(); }} />}
    {!dishesResource.loading && !dishesResource.error && (dishes.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{dishes.map((dish) => <article className="surface-card flex min-h-52 flex-col p-5" key={dish.id}><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-teal/10 text-teal"><UtensilsCrossed size={20} /></span><StatusBadge tone="success">Disponible</StatusBadge></div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-teal">{dish.categoryName}</p><h3 className="mt-1 text-lg font-bold text-navy">{dish.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{dish.description || "Preparado por la cocina de Periquito."}</p><p className="mt-4 text-lg font-bold text-navy">{formatCurrency(dish.price)}</p></article>)}</div> : <EmptyState title="No hay platos disponibles" description="La carta no tiene platos marcados como disponibles con estos filtros." />)}
  </div>;
}
