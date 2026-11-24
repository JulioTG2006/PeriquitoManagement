import { useCallback, useMemo, useRef, useState } from "react";
import { Armchair, CircleCheck, RefreshCw, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Modal, SelectField, StatusBadge } from "../../components/admin/AdminUi";
import { useApiResource } from "../../hooks/useApiResource";
import { restaurantService } from "../../services/restaurantService";
import { getApiErrorMessage } from "../../services/api";
import type { TableResponse } from "../../types/api";

type TableFilter = "all" | "available" | "occupied";

export function WaiterTablesPage() {
  const navigate = useNavigate();
  const load = useCallback(() => restaurantService.getTables(), []);
  const { data, loading, error, reload } = useApiResource<TableResponse[]>(load);
  const [filter, setFilter] = useState<TableFilter>("all");
  const [selected, setSelected] = useState<TableResponse | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const requestLock = useRef(false);
  const tables = data ?? [];
  const availableCount = tables.filter((table) => isAvailable(table.status)).length;
  const occupiedCount = tables.length - availableCount;
  const visibleTables = useMemo(() => tables.filter((table) => filter === "all"
    || (filter === "available" ? isAvailable(table.status) : !isAvailable(table.status))), [tables, filter]);

  async function openSelectedTable() {
    if (!selected || requestLock.current) return;
    const table = selected;
    requestLock.current = true;
    setPendingId(table.id);
    try {
      const order = await restaurantService.createOrder(table.id);
      setSelected(null);
      navigate(`/mesero/pedidos/${order.id}`);
    } catch (cause) {
      toast.error("No se pudo abrir el pedido", { description: getApiErrorMessage(cause, "La mesa pudo ser ocupada por otro mesero. Actualiza las mesas e inténtalo nuevamente.") });
      await reload();
    } finally {
      requestLock.current = false;
      setPendingId(null);
    }
  }

  async function continueTableOrder(table: TableResponse) {
    if (requestLock.current) return;
    requestLock.current = true;
    setPendingId(table.id);
    try {
      const order = await restaurantService.getActiveOrderForTable(table.id);
      navigate(`/mesero/pedidos/${order.id}`);
    } catch (cause) {
      toast.error("No se encontró el pedido activo", { description: getApiErrorMessage(cause, "Actualiza las mesas para consultar el estado más reciente.") });
      await reload();
    } finally {
      requestLock.current = false;
      setPendingId(null);
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-teal">Servicio</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Mesas</h2><p className="mt-1 text-sm text-slate-500">Selecciona una mesa disponible o continúa un pedido en atención.</p></div><button className="button-secondary min-h-11" disabled={loading} onClick={() => void reload()} type="button"><RefreshCw size={16} />Actualizar</button></div>
    <div className="grid gap-3 sm:grid-cols-2"><div className="surface-card flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CircleCheck size={19} /></span><div><p className="text-xs font-semibold text-slate-500">Disponibles</p><p className="text-xl font-bold text-navy">{availableCount}</p></div></div><div className="surface-card flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Armchair size={19} /></span><div><p className="text-xs font-semibold text-slate-500">Ocupadas</p><p className="text-xl font-bold text-navy">{occupiedCount}</p></div></div></div>
    <div className="max-w-xs"><SelectField label="Filtrar mesas" value={filter} onChange={(value) => setFilter(value as TableFilter)}><option value="all">Todas las mesas</option><option value="available">Disponibles</option><option value="occupied">Ocupadas</option></SelectField></div>
    {loading && <LoadingState label="Consultando mesas" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}
    {!loading && !error && (visibleTables.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleTables.map((table) => {
      const available = isAvailable(table.status);
      return <article className={`surface-card flex min-h-52 flex-col border-t-4 p-5 ${available ? "border-t-teal" : "border-t-amber"}`} key={table.id}><div className="flex items-start justify-between gap-3"><span className={`grid size-12 place-items-center rounded-2xl ${available ? "bg-teal/10 text-teal" : "bg-amber/15 text-amber-700"}`}><Armchair size={22} /></span><StatusBadge tone={available ? "success" : "warning"}>{available ? "Disponible" : "Ocupada"}</StatusBadge></div><h3 className="mt-4 text-xl font-bold text-navy">Mesa {table.tableNumber}</h3><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><UsersRound size={16} />Capacidad para {table.capacity} personas</p><button className={`${available ? "button-primary" : "button-secondary"} mt-5 min-h-11 w-full`} disabled={pendingId === table.id} onClick={() => available ? setSelected(table) : void continueTableOrder(table)} type="button">{pendingId === table.id ? "Consultando…" : available ? "Abrir pedido" : "Continuar pedido"}</button></article>;
    })}</div> : <EmptyState title="No hay mesas en este filtro" description="Cambia el filtro o actualiza el estado de las mesas." />)}
    {selected && <Modal title={`Abrir pedido · Mesa ${selected.tableNumber}`} description={`Mesa para ${selected.capacity} personas. Se marcará ocupada al crear el pedido.`} onClose={() => setSelected(null)}><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="button-secondary min-h-11" disabled={pendingId !== null} onClick={() => setSelected(null)} type="button">Volver</button><button className="button-primary min-h-11" disabled={pendingId !== null} onClick={() => void openSelectedTable()} type="button">{pendingId === selected.id ? "Abriendo pedido…" : "Confirmar y abrir"}</button></div></Modal>}
  </div>;
}

function isAvailable(status: string) { return status.toLocaleLowerCase("es").includes("disponible"); }
