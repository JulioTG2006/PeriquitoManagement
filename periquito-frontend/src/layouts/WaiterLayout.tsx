import { ClipboardList, UserRound, Utensils, UtensilsCrossed } from "lucide-react";
import { PortalLayout } from "./PortalLayout";

const items = [
  { label: "Mesas", to: "/mesero/mesas", icon: Utensils },
  { label: "Pedidos activos", to: "/mesero/pedidos", icon: ClipboardList },
  { label: "Carta de platos", to: "/mesero/carta", icon: UtensilsCrossed },
  { label: "Mi perfil", to: "/mesero/perfil", icon: UserRound },
];

export function WaiterLayout() {
  return <PortalLayout items={items} roleLabel="Mesero" />;
}
