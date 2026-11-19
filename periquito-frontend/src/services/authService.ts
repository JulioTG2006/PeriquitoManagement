import { api } from "./api";
import type {
  CurrentUserResponse,
  LoginResponse,
} from "../types/auth";

export const authService = {
  async login(username: string, password: string) {
    const response = await api.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    return response.data;
  },

  async me() {
    const response = await api.get<CurrentUserResponse>("/auth/me");
    return response.data;
  },
};
