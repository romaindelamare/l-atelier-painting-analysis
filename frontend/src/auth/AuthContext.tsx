import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import * as api from "../api/client";
import { getAccessToken, subscribe } from "./session";

interface AuthState {
  /** True once a valid session is established. */
  isAuthenticated: boolean;
  /** True during the initial token check on load (avoids a login flash). */
  checking: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAccessToken());
  const [checking, setChecking] = useState(true);

  // Reflect session changes made anywhere (e.g. the client clearing tokens after
  // a failed refresh) into React state so guards re-render.
  useEffect(() => subscribe(() => setIsAuthenticated(!!getAccessToken())), []);

  // Validate any persisted token against the server on first load.
  useEffect(() => {
    let active = true;
    api
      .checkAuth()
      .then((ok) => active && setIsAuthenticated(ok))
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (password: string) => {
    await api.login(password);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setIsAuthenticated(false);
  }, []);

  const logoutEverywhere = useCallback(async () => {
    await api.logoutEverywhere();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, checking, login, logout, logoutEverywhere }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
