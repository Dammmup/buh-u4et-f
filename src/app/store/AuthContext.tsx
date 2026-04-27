import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { api } from "../../shared/api/client";
import type { AuthResponse, User } from "../../entities/user/model";

interface Credentials {
  email: string;
  password: string;
}

interface RegisterPayload extends Credentials {
  name: string;
}

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  login: (payload: Credentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setReady] = useState(false);

  const setSession = useCallback((response: AuthResponse) => {
    localStorage.setItem("auth_token", response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setReady(true);
      return;
    }

    api
      .get<{ user: User }>("/auth/me")
      .then((response) => setUser(response.data.user))
      .catch(logout)
      .finally(() => setReady(true));
  }, [logout]);

  const login = useCallback(
    async (payload: Credentials) => {
      const response = await api.post<AuthResponse>("/auth/login", payload);
      setSession(response.data);
    },
    [setSession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await api.post<AuthResponse>("/auth/register", payload);
      setSession(response.data);
    },
    [setSession]
  );

  const value = useMemo(
    () => ({ user, isReady, login, register, logout }),
    [isReady, login, logout, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
