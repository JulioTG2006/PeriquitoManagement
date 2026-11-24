import { useCallback } from "react";
import { BadgeCheck, RefreshCw, UserRound } from "lucide-react";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useApiResource } from "../../hooks/useApiResource";
import { authService } from "../../services/authService";
import type { CurrentUserResponse } from "../../types/auth";

export function ProfilePage() {
  const load = useCallback(() => authService.me(), []);
  const { data, loading, error, reload } = useApiResource<CurrentUserResponse>(load);

  return <div className="space-y-6"><div><p className="text-sm font-medium text-teal">Cuenta</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Mi perfil</h2><p className="mt-1 text-sm text-slate-500">Datos devueltos por el servicio de autenticación.</p></div>{loading && <LoadingState label="Consultando perfil" />}{error && <ErrorState message={error} onRetry={() => void reload()} />}{!loading && !error && data && <section className="surface-card max-w-2xl p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-teal/10 text-teal"><UserRound size={25} /></span><button className="button-secondary min-h-11" disabled={loading} onClick={() => void reload()} type="button"><RefreshCw size={16} />Actualizar</button></div><dl className="mt-6 divide-y divide-slate-100"><ProfileItem label="Identificador" value={String(data.id)} /><ProfileItem label="Usuario" value={data.username} /><ProfileItem label="Rol" value={data.role} /></dl><p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><BadgeCheck size={15} />Sesión verificada mediante GET /api/auth/me.</p></section>}</div>;
}

function ProfileItem({ label, value }: { label: string; value: string }) { return <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="text-sm font-semibold text-navy">{value}</dd></div>; }
