import { useCallback, useMemo, useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, Form, FormActions, Modal, PageTitle, SearchInput, SelectField, StatusBadge } from "../../components/admin/AdminUi";
import { DateRangeControls, rangeForPreset, type DateRangeValue } from "../../components/admin/DateRangeControls";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { MetricCard } from "../../components/MetricCard";
import { useApiResource } from "../../hooks/useApiResource";
import { adminService } from "../../services/adminService";
import { getApiErrorMessage } from "../../services/api";
import type { IngredientDto, InventoryMovementDto } from "../../types/admin";
import { formatPeruDateTime, peruLocalDateTimeToUtc } from "../../utils/format";

export function InventoryPage() {
  const [lowOnly, setLowOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [movementType, setMovementType] = useState("");
  const [ingredientFilter, setIngredientFilter] = useState("");
  const [range, setRange] = useState<DateRangeValue>(() => rangeForPreset("week"));
  const loadIngredients = useCallback(() => adminService.ingredients(lowOnly), [lowOnly]);
  const loadAll = useCallback(() => adminService.ingredients(), []);
  const loadLow = useCallback(() => adminService.ingredients(true), []);
  const loadMovements = useCallback(() => adminService.inventoryMovements({
    ingredientId: ingredientFilter ? Number(ingredientFilter) : undefined,
    movementType: movementType ? movementType as "Entrada" | "Salida" : undefined,
    fromUtc: range.fromDate && range.toDate ? peruLocalDateTimeToUtc(range.fromDate) : undefined,
    toUtc: range.fromDate && range.toDate ? peruLocalDateTimeToUtc(range.toDate, true) : undefined,
  }), [ingredientFilter, movementType, range]);
  const ingredients = useApiResource<IngredientDto[]>(loadIngredients);
  const all = useApiResource<IngredientDto[]>(loadAll);
  const low = useApiResource<IngredientDto[]>(loadLow);
  const movements = useApiResource<InventoryMovementDto[]>(loadMovements);
  const [editing, setEditing] = useState<IngredientDto | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<IngredientDto | null>(null);
  const [moving, setMoving] = useState<{ ingredient: IngredientDto; direction: "entries" | "exits" } | null>(null);
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => (ingredients.data ?? []).filter((ingredient) => ingredient.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))), [ingredients.data, query]);

  async function saveIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setSaving(true);
    try { await adminService.saveIngredient({ name: String(form.get("name") ?? "").trim(), unitOfMeasure: String(form.get("unitOfMeasure") ?? "").trim(), minimumStock: Number(form.get("minimumStock")), isActive: form.get("isActive") === "on" }, editing?.id); toast.success(editing ? "Insumo actualizado" : "Insumo registrado"); setEditing(undefined); await Promise.all([ingredients.reload(), all.reload(), low.reload()]); }
    catch (cause) { toast.error("No se pudo guardar el insumo", { description: getApiErrorMessage(cause, "Revisa los datos e inténtalo nuevamente.") }); }
    finally { setSaving(false); }
  }

  async function deleteIngredient() {
    if (!deleting) return; setSaving(true);
    try { await adminService.deleteIngredient(deleting.id); toast.success("Insumo eliminado"); setDeleting(null); await Promise.all([ingredients.reload(), all.reload(), low.reload()]); }
    catch (cause) { toast.error("No se pudo eliminar el insumo", { description: getApiErrorMessage(cause, "Un insumo con movimientos históricos no se puede eliminar.") }); }
    finally { setSaving(false); }
  }

  async function registerMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!moving) return; const form = new FormData(event.currentTarget); setSaving(true);
    try {
      const result = await adminService.registerMovement(moving.ingredient.id, moving.direction, { quantity: Number(form.get("quantity")), reason: String(form.get("reason") ?? "").trim() });
      toast.success(moving.direction === "entries" ? "Entrada registrada" : "Salida registrada", { description: `Stock actual: ${result.currentStock} ${moving.ingredient.unitOfMeasure}` });
      setMoving(null); await Promise.all([ingredients.reload(), all.reload(), low.reload(), movements.reload()]);
    } catch (cause) { toast.error("No se pudo registrar el movimiento", { description: getApiErrorMessage(cause, "Verifica el stock y los datos del movimiento.") }); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <PageTitle title="Inventario" description="Consulta existencias y registra movimientos de insumos." actions={<><button className="button-secondary" onClick={() => setMoving({ ingredient: filtered[0] ?? all.data?.[0] as IngredientDto, direction: "entries" })} disabled={!((all.data?.length ?? 0) > 0)} type="button"><ArrowDownToLine size={16} />Registrar entrada</button><button className="button-primary" onClick={() => setEditing(null)} type="button"><Plus size={17} />Nuevo insumo</button></>} />
    <div className="grid gap-4 sm:grid-cols-2"><MetricCard label="Insumos registrados" value={String(all.data?.length ?? 0)} note="Incluye insumos activos e inactivos" icon={ArrowDownToLine} tone="navy" /><MetricCard label="En stock bajo" value={String(low.data?.length ?? 0)} note="Existencia igual o menor al mínimo" icon={ArrowUpFromLine} tone="amber" /></div>
    {(all.loading || low.loading) && !all.data && <LoadingState label="Consultando indicadores" />}
    <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold text-navy">Insumos</h3><p className="text-sm text-slate-500">El stock se modifica únicamente mediante movimientos.</p></div><label className="flex items-center gap-2 text-sm font-medium text-slate-600"><input checked={lowOnly} className="size-4 accent-teal" onChange={(event) => setLowOnly(event.target.checked)} type="checkbox" />Solo stock bajo</label></div>
      <div className="flex flex-wrap gap-3"><SearchInput value={query} onChange={setQuery} placeholder="Buscar insumo" /></div>
      {ingredients.loading && <LoadingState label="Cargando insumos" />}{ingredients.error && <ErrorState message={ingredients.error} onRetry={() => void ingredients.reload()} />}
      {!ingredients.loading && !ingredients.error && <DataTable rows={filtered} rowKey={(row) => row.id} emptyTitle="No hay insumos" columns={[
        { key: "name", title: "Insumo", render: (row) => <span className="font-semibold text-navy">{row.name}</span> },
        { key: "stock", title: "Stock actual", render: (row) => <span className="font-semibold">{row.currentStock} {row.unitOfMeasure}</span> },
        { key: "minimum", title: "Stock mínimo", render: (row) => `${row.minimumStock} ${row.unitOfMeasure}` },
        { key: "low", title: "Nivel", render: (row) => row.isLowStock ? <StatusBadge tone="warning">Stock bajo</StatusBadge> : <StatusBadge tone="success">Adecuado</StatusBadge> },
        { key: "active", title: "Estado", render: (row) => <StatusBadge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Activo" : "Inactivo"}</StatusBadge> },
        { key: "actions", title: "Acciones", className: "text-right", render: (row) => <div className="flex justify-end gap-1"><button className="button-quiet" aria-label={`Registrar entrada de ${row.name}`} onClick={() => setMoving({ ingredient: row, direction: "entries" })} type="button"><ArrowDownToLine size={16} /></button><button className="button-quiet" aria-label={`Registrar salida de ${row.name}`} onClick={() => setMoving({ ingredient: row, direction: "exits" })} type="button"><ArrowUpFromLine size={16} /></button><button className="button-quiet" aria-label={`Editar ${row.name}`} onClick={() => setEditing(row)} type="button"><Pencil size={16} /></button><button className="button-quiet text-rose-600" aria-label={`Eliminar ${row.name}`} onClick={() => setDeleting(row)} type="button"><Trash2 size={16} /></button></div> },
      ]} />}
    </section>
    <section className="space-y-4"><div><h3 className="text-lg font-bold text-navy">Historial de movimientos</h3><p className="text-sm text-slate-500">Entradas y salidas registradas por la API.</p></div><DateRangeControls onApply={setRange} /><div className="grid gap-3 sm:grid-cols-2"><SelectField label="Insumo" value={ingredientFilter} onChange={setIngredientFilter}><option value="">Todos los insumos</option>{(all.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><SelectField label="Tipo de movimiento" value={movementType} onChange={setMovementType}><option value="">Todos</option><option value="Entrada">Entradas</option><option value="Salida">Salidas</option></SelectField></div>{movements.loading && <LoadingState label="Cargando movimientos" />}{movements.error && <ErrorState message={movements.error} onRetry={() => void movements.reload()} />}{!movements.loading && !movements.error && <DataTable rows={movements.data ?? []} rowKey={(row) => row.id} emptyTitle="Sin movimientos en este período" columns={[
      { key: "date", title: "Fecha (Perú)", render: (row) => formatPeruDateTime(row.occurredAt) },
      { key: "ingredient", title: "Insumo", render: (row) => <span className="font-semibold text-navy">{row.ingredientName}</span> },
      { key: "type", title: "Tipo", render: (row) => <StatusBadge tone={row.movementType === "Entrada" ? "success" : "warning"}>{row.movementType}</StatusBadge> },
      { key: "quantity", title: "Cantidad", render: (row) => `${row.quantity} ${row.unitOfMeasure}` },
      { key: "reason", title: "Motivo", render: (row) => row.reason || "—" },
      { key: "user", title: "Responsable", render: (row) => row.responsibleUsername || "—" },
    ]} />}</section>
    {editing !== undefined && <IngredientForm initial={editing} saving={saving} onClose={() => setEditing(undefined)} onSubmit={saveIngredient} />}
    {moving && <MovementForm ingredient={moving.ingredient} direction={moving.direction} saving={saving} onClose={() => setMoving(null)} onSubmit={registerMovement} />}
    {deleting && <ConfirmDialog title="Eliminar insumo" description={`¿Eliminar “${deleting.name}”? Si tiene historial de movimientos, la API rechazará la eliminación.`} loading={saving} onCancel={() => setDeleting(null)} onConfirm={() => void deleteIngredient()} confirmLabel="Eliminar insumo" />}
  </div>;
}

function IngredientForm({ initial, saving, onClose, onSubmit }: { initial: IngredientDto | null; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={initial ? "Editar insumo" : "Registrar insumo"} description="El stock actual no se edita en este formulario." onClose={onClose}><Form onSubmit={onSubmit}><label className="block text-sm font-semibold text-slate-700">Nombre<input className="field-input mt-2 block" defaultValue={initial?.name ?? ""} maxLength={120} name="name" required /></label><label className="block text-sm font-semibold text-slate-700">Unidad de medida<input className="field-input mt-2 block" defaultValue={initial?.unitOfMeasure ?? ""} maxLength={20} name="unitOfMeasure" placeholder="kg, L, unidad" required /></label><label className="block text-sm font-semibold text-slate-700">Stock mínimo<input className="field-input mt-2 block" defaultValue={initial?.minimumStock ?? "0"} min="0" name="minimumStock" required step="0.001" type="number" /></label>{initial && <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input className="size-4 accent-teal" defaultChecked={initial.isActive} name="isActive" type="checkbox" />Insumo activo</label>}<FormActions loading={saving} onCancel={onClose} submitLabel={initial ? "Guardar cambios" : "Registrar insumo"} /></Form></Modal>;
}

function MovementForm({ ingredient, direction, saving, onClose, onSubmit }: { ingredient: IngredientDto; direction: "entries" | "exits"; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const entry = direction === "entries";
  return <Modal title={entry ? "Registrar entrada" : "Registrar salida"} description={`${ingredient.name} · stock actual ${ingredient.currentStock} ${ingredient.unitOfMeasure}`} onClose={onClose}><Form onSubmit={onSubmit}><label className="block text-sm font-semibold text-slate-700">Cantidad ({ingredient.unitOfMeasure})<input autoFocus className="field-input mt-2 block" min="0.001" name="quantity" required step="0.001" type="number" /></label><label className="block text-sm font-semibold text-slate-700">Motivo<textarea className="field-input mt-2 block min-h-24 resize-y" maxLength={250} name="reason" required /></label><FormActions loading={saving} onCancel={onClose} submitLabel={entry ? "Guardar entrada" : "Guardar salida"} /></Form></Modal>;
}
