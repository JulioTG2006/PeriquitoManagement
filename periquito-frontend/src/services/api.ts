import axios from "axios";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_API_URL?.trim() || "/api";

export const api = axios.create({
  baseURL,
  headers: { Accept: "application/json" },
  timeout: 20_000,
});

let unauthorizedHandler: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  const token = accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const requestPath = error.config?.url ?? "";
      if (status === 401 && !requestPath.endsWith("/auth/login")) {
        unauthorizedHandler?.();
      }
      if (status === 403) {
        toast.error("Acceso denegado", {
          description: "Tu cuenta no tiene permiso para realizar esta acción.",
        });
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ detail?: string; title?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.title || fallback;
  }
  return fallback;
}
