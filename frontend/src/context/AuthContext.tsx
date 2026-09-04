import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import type { Utilisateur } from "../types";

const TIMEOUT_MS = 15 * 60 * 1000;

interface AuthContextType {
  user: Utilisateur | null;
  token: string | null;
  login: (token: string, user: Utilisateur) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          setToken(storedToken);
          const userData = await authService.me();
          setUser(userData);
        } catch {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const doLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doLogout();
    }, TIMEOUT_MS);
  }, [doLogout]);

  useEffect(() => {
    if (!token) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [token, resetTimer]);

  const login = useCallback((newToken: string, newUser: Utilisateur) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout: doLogout,
        isAuthenticated: !!token && !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
