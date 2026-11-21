import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { AdminLayout } from "../layouts/AdminLayout";
import { WaiterLayout } from "../layouts/WaiterLayout";
import { LoginPage } from "../pages/LoginPage";
import { LoadingState } from "../components/LoadingState";
import { CategoriesPage } from "../pages/admin/CategoriesPage";
import { DishesPage } from "../pages/admin/DishesPage";
import { TablesPage } from "../pages/admin/TablesPage";
import { OrdersPage } from "../pages/admin/OrdersPage";
import { SalesPage } from "../pages/admin/SalesPage";
import { InventoryPage } from "../pages/admin/InventoryPage";
import { ReportsPage } from "../pages/admin/ReportsPage";
import { UsersPage } from "../pages/admin/UsersPage";
import { WaiterTablesPage } from "../pages/waiter/WaiterTablesPage";
import { ActiveOrdersPage } from "../pages/waiter/ActiveOrdersPage";
import { MenuPage } from "../pages/waiter/MenuPage";
import { ProfilePage } from "../pages/waiter/ProfilePage";
import { roleLandingPath } from "../utils/format";

const DashboardPage = lazy(() => import("../pages/admin/DashboardPage").then((module) => ({ default: module.DashboardPage })));

function Authenticated({ allowedRole }: { allowedRole?: "Administrador" | "Mesero" }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    toast.error("Acceso denegado", { description: "Tu rol no puede abrir esta sección." });
    return <Navigate to={roleLandingPath(user.role)} replace />;
  }
  return <Outlet />;
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  return <Navigate to={isAuthenticated && user ? roleLandingPath(user.role) : "/login"} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Authenticated allowedRole="Administrador" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<LoadingState label="Abriendo dashboard" />}><DashboardPage /></Suspense>} />
          <Route path="platos" element={<DishesPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="mesas" element={<TablesPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="ventas" element={<SalesPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
        </Route>
      </Route>
      <Route element={<Authenticated allowedRole="Mesero" />}>
        <Route path="/mesero" element={<WaiterLayout />}>
          <Route index element={<Navigate to="mesas" replace />} />
          <Route path="mesas" element={<WaiterTablesPage />} />
          <Route path="pedidos" element={<ActiveOrdersPage />} />
          <Route path="carta" element={<MenuPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
