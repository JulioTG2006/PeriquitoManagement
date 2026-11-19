import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";
import { authService } from "../services/authService";
import { setAccessToken, setUnauthorizedHandler } from "../services/api";
import type { AuthUser } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: (message?: string) => void;
  verifySession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const logout = useCallback((message?: string) => {
    setAccessToken(null);
    setToken(null);
    setExpiresAt(null);
    setUser(null);
    if (message) toast.info(message);
  }, []);

  const verifySession = useCallback(async () => {
    if (!token) return;
    const current = await authService.me();
    setUser((previous) => previous
      ? { ...previous, id: current.id, username: current.username, role: current.role }
      : null);
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.login(username, password);
    setAccessToken(result.accessToken);
    setToken(result.accessToken);
    setExpiresAt(result.expiresAtUtc);

    try {
      const current = await authService.me();
      const authenticatedUser = {
        id: current.id,
        username: current.username,
        fullName: result.user.fullName,
        role: current.role,
      };
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      setAccessToken(null);
      setToken(null);
      setExpiresAt(null);
      setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout("Tu sesión venció. Inicia sesión nuevamente."));
    return () => setUnauthorizedHandler(undefined);
  }, [logout]);

  useEffect(() => {
    if (!expiresAt) return;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      logout("Tu sesión venció. Inicia sesión nuevamente.");
      return;
    }
    const timeout = window.setTimeout(
      () => logout("Tu sesión venció. Inicia sesión nuevamente."),
      remaining,
    );
    return () => window.clearTimeout(timeout);
  }, [expiresAt, logout]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(user && token),
    login,
    logout,
    verifySession,
  }), [user, token, login, logout, verifySession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
