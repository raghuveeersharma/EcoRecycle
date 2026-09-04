import { useCallback, useEffect, useMemo, useState } from "react";
import api, { TOKEN_KEY, USER_KEY } from "../lib/api";
import { AuthContext } from "./authContext";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const persist = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clear = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  // While a stored token is being verified we must not redirect to /login,
  // or a refresh on a protected page would bounce the user out.
  const [isRestoring, setIsRestoring] = useState(
    () => Boolean(localStorage.getItem(TOKEN_KEY))
  );

  const logout = useCallback(() => {
    clear();
    setUser(null);
  }, []);

  // Re-hydrate the session on boot, and drop it if the token is no longer valid.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    let cancelled = false;
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data.data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      })
      .catch(() => {
        if (cancelled) return;
        clear();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("ecorecycle:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("ecorecycle:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    persist(data.data.token, data.data.user);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (details) => {
    const { data } = await api.post("/auth/register", details);
    persist(data.data.token, data.data.user);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isRestoring,
      login,
      register,
      logout,
      // Deprecated: kept for the old boolean-based API.
      LoginState: Boolean(user),
      setLoginState: (next) => {
        if (!next) logout();
      },
    }),
    [user, isRestoring, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
