import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import type { NavigationItem } from "../components/PortalSidebar";
import { PortalHeader } from "../components/PortalHeader";
import { PortalSidebar } from "../components/PortalSidebar";

export function PortalLayout({
  items,
  roleLabel,
}: {
  items: NavigationItem[];
  roleLabel: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const activeItem = [...items]
    .sort((left, right) => right.to.length - left.to.length)
    .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
  const title = activeItem?.label ?? roleLabel;

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <PortalSidebar
        items={items}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        roleLabel={roleLabel}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <PortalHeader
          title={title}
          subtitle="Restaurante Periquito · Gestión de operación"
          onMenu={() => setMenuOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          <div className="mx-auto w-full max-w-[1480px]"><Outlet /></div>
        </main>
        <footer className="px-4 pb-5 text-center text-[11px] text-slate-400 sm:px-7">
          Restaurante Periquito · Sistema de gestión
        </footer>
      </div>
    </div>
  );
}
