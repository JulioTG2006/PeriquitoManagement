import { LogOut, Menu, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function PortalHeader({
  title,
  subtitle,
  onMenu,
}: {
  title: string;
  subtitle: string;
  onMenu: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <header className="flex min-h-[78px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 sm:px-7 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <button aria-label="Abrir menú" className="rounded-xl border border-slate-200 p-2 text-navy hover:bg-slate-50 lg:hidden" onClick={onMenu}>
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-navy sm:text-xl">{title}</h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-600">
            <UserRound size={17} />
          </span>
          <div className="max-w-44">
            <p className="truncate text-sm font-semibold text-navy">{user?.fullName || user?.username}</p>
            <p className="text-[11px] text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button className="button-quiet" onClick={() => logout("Sesión cerrada.")} type="button">
          <LogOut size={17} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
