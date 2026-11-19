import { useState } from "react";
import { BadgeCheck, RefreshCw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { useAuth } from "../../context/AuthContext";

export function ProfilePage() {
  const { user, verifySession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function refresh() {
    setLoading(true); setError(null);
    try { await verifySession(); toast.success("Sesión verificada con la API"); }
    catch { setError("No se pudo verificar la sesión."); }
    finally { setLoading(false); }
  }
  return <div className="space-y-6"><div><p className="text-sm font-medium text-teal">Cuenta</p><h2 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Mi perfil</h2><p className="mt-1 text-sm text-slate-500">Información de la sesión actual.</p></div>{loading ? <LoadingState label="Verificando sesión" /> : error ? <ErrorState message={error} onRetry={() => void refresh()} /> : <section className="surface-card max-w-2xl p-6 sm:p-8"><span className="grid size-14 place-items-center rounded-2xl bg-teal/10 text-teal"><UserRound size={25} /></span><dl className="mt-6 divide-y divide-slate-100"><ProfileItem label="Nombre" value={user?.fullName || "—"} /><ProfileItem label="Usuario" value={user?.username || "—"} /><ProfileItem label="Rol" value={user?.role || "—"} /></dl><button className="button-secondary mt-6" onClick={() => void refresh()} type="button"><RefreshCw size={16} />Verificar sesión</button><p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><BadgeCheck size={15} />Identidad comprobada desde el servicio de autenticación.</p></section>}</div>;
}
function ProfileItem({ label, value }: { label: string; value: string }) { return <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="text-sm font-semibold text-navy">{value}</dd></div>; }
