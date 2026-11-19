import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "./Brand";

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export function PortalSidebar({
  items,
  open,
  onClose,
  roleLabel,
}: {
  items: NavigationItem[];
  open: boolean;
  onClose: () => void;
  roleLabel: string;
}) {
  return (
    <>
      {open && <button aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-navy/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-navy px-5 py-6 text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Brand inverse />
          <button aria-label="Cerrar menú" className="rounded-lg p-2 text-white/75 hover:bg-white/10 lg:hidden" onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div className="mt-10">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Menú principal</p>
          <nav aria-label="Navegación principal" className="mt-3 space-y-1">
            {items.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${isActive ? "bg-white text-navy shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs font-semibold text-white/60">Sesión activa</p>
          <p className="mt-1 text-sm font-semibold">{roleLabel}</p>
          <p className="mt-3 text-[11px] leading-5 text-white/45">Gestión diaria del Restaurante Periquito</p>
        </div>
      </aside>
    </>
  );
}
