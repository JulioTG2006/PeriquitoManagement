import { api } from "./api";
import type { DishResponse, OrderResponse, TableResponse } from "../types/api";

export const restaurantService = {
  async getTables() {
    const response = await api.get<TableResponse[]>("/tables");
    return response.data;
  },
  async getActiveOrders() {
    const response = await api.get<OrderResponse[]>("/orders/active");
    return response.data;
  },
  async getDishes() {
    const response = await api.get<DishResponse[]>("/dishes", {
      params: { isAvailable: true },
    });
    return response.data;
  },
};
