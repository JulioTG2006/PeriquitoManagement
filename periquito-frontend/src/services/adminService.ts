import { api } from "./api";
import type {
  AdminDishDto,
  AdminOrderDto,
  CategoryDto,
  IngredientDto,
  InventoryMovementDto,
  InventoryMovementResultDto,
  InventoryMovementQuery,
  SaleDto,
  SaleReportQuery,
  TableDto,
  UserDto,
} from "../types/admin";
import type { DashboardResponse } from "../types/api";

export const adminService = {
  async dashboard(params: { fromDate?: string; toDate?: string } = {}) {
    return (await api.get<DashboardResponse>("/dashboard", { params })).data;
  },
  async categories() { return (await api.get<CategoryDto[]>("/categories")).data; },
  async saveCategory(input: { name: string; isActive: boolean }, id?: number) {
    return id
      ? (await api.put<CategoryDto>(`/categories/${id}`, input)).data
      : (await api.post<CategoryDto>("/categories", input)).data;
  },
  async deleteCategory(id: number) { await api.delete(`/categories/${id}`); },
  async dishes(params: { categoryId?: number; isAvailable?: boolean } = {}) {
    return (await api.get<AdminDishDto[]>("/dishes", { params })).data;
  },
  async saveDish(input: { categoryId: number; name: string; description: string | null; price: number; cost: number; isAvailable: boolean }, id?: number) {
    return id
      ? (await api.put<AdminDishDto>(`/dishes/${id}`, input)).data
      : (await api.post<AdminDishDto>("/dishes", input)).data;
  },
  async setDishAvailability(id: number, isAvailable: boolean) {
    return (await api.patch<AdminDishDto>(`/dishes/${id}/availability`, JSON.stringify(isAvailable), {
      headers: { "Content-Type": "application/json" },
    })).data;
  },
  async deleteDish(id: number) { await api.delete(`/dishes/${id}`); },
  async tables(status?: string) { return (await api.get<TableDto[]>("/tables", { params: status ? { status } : {} })).data; },
  async saveTable(input: { tableNumber: number; capacity: number }, id?: number) {
    return id
      ? (await api.put<TableDto>(`/tables/${id}`, input)).data
      : (await api.post<TableDto>("/tables", input)).data;
  },
  async deleteTable(id: number) { await api.delete(`/tables/${id}`); },
  async activeOrderForTable(tableId: number) { return (await api.get<AdminOrderDto>(`/orders/tables/${tableId}/active`)).data; },
  async orders() { return (await api.get<AdminOrderDto[]>("/orders")).data; },
  async order(id: number) { return (await api.get<AdminOrderDto>(`/orders/${id}`)).data; },
  async addOrderItem(orderId: number, dishId: number, quantity: number) {
    return (await api.post<AdminOrderDto>(`/orders/${orderId}/items`, { dishId, quantity })).data;
  },
  async setOrderItemQuantity(orderId: number, dishId: number, quantity: number) {
    return (await api.put<AdminOrderDto>(`/orders/${orderId}/items/${dishId}`, { quantity })).data;
  },
  async removeOrderItem(orderId: number, dishId: number) { return (await api.delete<AdminOrderDto>(`/orders/${orderId}/items/${dishId}`)).data; },
  async cancelOrder(orderId: number) { return (await api.post<AdminOrderDto>(`/orders/${orderId}/cancel`)).data; },
  async completeOrder(orderId: number) { return (await api.post(`/sales/orders/${orderId}/complete`)).data; },
  async sales(params: SaleReportQuery = {}) { return (await api.get<SaleDto[]>("/sales", { params })).data; },
  async ingredients(lowStock = false) {
    return (await api.get<IngredientDto[]>(lowStock ? "/ingredients/low-stock" : "/ingredients")).data;
  },
  async saveIngredient(input: { name: string; unitOfMeasure: string; minimumStock: number; isActive?: boolean }, id?: number) {
    return id
      ? (await api.put<IngredientDto>(`/ingredients/${id}`, { ...input, isActive: input.isActive ?? true })).data
      : (await api.post<IngredientDto>("/ingredients", { name: input.name, unitOfMeasure: input.unitOfMeasure, minimumStock: input.minimumStock })).data;
  },
  async deleteIngredient(id: number) { await api.delete(`/ingredients/${id}`); },
  async inventoryMovements(params: InventoryMovementQuery = {}) {
    return (await api.get<InventoryMovementDto[]>("/inventory/movements", { params })).data;
  },
  async registerMovement(ingredientId: number, type: "entries" | "exits", input: { quantity: number; reason: string }) {
    return (await api.post<InventoryMovementResultDto>(`/inventory/ingredients/${ingredientId}/${type}`, input)).data;
  },
  async users() { return (await api.get<UserDto[]>("/users")).data; },
  async saveUser(input: { username?: string; fullName: string; password?: string | null; role: string; isActive: boolean }, id?: number) {
    if (id) return (await api.put<UserDto>(`/users/${id}`, { fullName: input.fullName, role: input.role, isActive: input.isActive, password: input.password || null })).data;
    return (await api.post<UserDto>("/users", { username: input.username, fullName: input.fullName, password: input.password, role: input.role })).data;
  },
  async deactivateUser(id: number) { await api.delete(`/users/${id}`); },
  async downloadSalesReport(params: { fromDate?: string; toDate?: string }) {
    return api.get<Blob>("/reports/sales.xlsx", { params, responseType: "blob" });
  },
};
