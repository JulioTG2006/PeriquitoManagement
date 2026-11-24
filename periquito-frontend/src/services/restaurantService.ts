import { api } from "./api";
import type { CategoryResponse, DishResponse, OrderResponse, SaleConfirmationResponse, TableResponse } from "../types/api";

export const restaurantService = {
  async getTables() {
    const response = await api.get<TableResponse[]>("/tables");
    return response.data;
  },
  async getCategories() {
    const response = await api.get<CategoryResponse[]>("/categories");
    return response.data;
  },
  async getActiveOrders() {
    const response = await api.get<OrderResponse[]>("/orders/active");
    return response.data;
  },
  async getOrder(id: number) {
    const response = await api.get<OrderResponse>(`/orders/${id}`);
    return response.data;
  },
  async getActiveOrderForTable(tableId: number) {
    const response = await api.get<OrderResponse>(`/orders/tables/${tableId}/active`);
    return response.data;
  },
  async createOrder(tableId: number) {
    const response = await api.post<OrderResponse>("/orders", { tableId });
    return response.data;
  },
  async addOrderItem(orderId: number, dishId: number, quantity = 1) {
    const response = await api.post<OrderResponse>(`/orders/${orderId}/items`, { dishId, quantity });
    return response.data;
  },
  async setOrderItemQuantity(orderId: number, dishId: number, quantity: number) {
    const response = await api.put<OrderResponse>(`/orders/${orderId}/items/${dishId}`, { quantity });
    return response.data;
  },
  async removeOrderItem(orderId: number, dishId: number) {
    const response = await api.delete<OrderResponse>(`/orders/${orderId}/items/${dishId}`);
    return response.data;
  },
  async cancelOrder(orderId: number) {
    const response = await api.post<OrderResponse>(`/orders/${orderId}/cancel`);
    return response.data;
  },
  async completeOrder(orderId: number) {
    const response = await api.post<SaleConfirmationResponse>(`/sales/orders/${orderId}/complete`);
    return response.data;
  },
  async getDishes() {
    const response = await api.get<DishResponse[]>("/dishes", {
      params: { isAvailable: true },
    });
    return response.data;
  },
};
