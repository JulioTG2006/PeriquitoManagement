import { BarChart3, CookingPot, Layers3, LayoutDashboard, ReceiptText, Settings2, ShoppingBasket, Table2, UsersRound } from "lucide-react";
import { PortalLayout } from "./PortalLayout";

const items = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Platos", to: "/admin/platos", icon: CookingPot },
  { label: "Categorías", to: "/admin/categorias", icon: Layers3 },
  { label: "Mesas", to: "/admin/mesas", icon: Table2 },
  { label: "Pedidos", to: "/admin/pedidos", icon: ReceiptText },
  { label: "Ventas", to: "/admin/ventas", icon: BarChart3 },
  { label: "Inventario", to: "/admin/inventario", icon: ShoppingBasket },
  { label: "Reportes", to: "/admin/reportes", icon: Settings2 },
  { label: "Usuarios", to: "/admin/usuarios", icon: UsersRound },
];

export function AdminLayout() {
  return <PortalLayout items={items} roleLabel="Administrador" />;
}
