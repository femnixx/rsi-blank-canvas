import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(!!token);

  // On mount, if token exists, validate it via /api/auth/me
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .fetchMe(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (identifier, password) => {
    const isEmail = identifier.includes("@");
    const body = isEmail
      ? { email: identifier, password }
      : { nim: identifier, password };
    const data = await api.apiFetch("/api/auth/login", {
      method: "POST",
      body,
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (email, password, nim) => {
    const data = await api.apiFetch("/api/auth/register", {
      method: "POST",
      body: { email, password, nim },
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      isAdmin: !!user && user.role === "admin",
      login,
      register,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
