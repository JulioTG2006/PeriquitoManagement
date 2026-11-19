import { api } from "./api";
import type { DashboardResponse } from "../types/api";

export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}

export const dashboardService = {
  async getDashboard(params: DateRangeParams = {}) {
    const response = await api.get<DashboardResponse>("/dashboard", { params });
    return response.data;
  },
};
