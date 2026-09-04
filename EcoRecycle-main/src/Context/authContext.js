import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

// Deprecated alias kept so any straggling `useContext(LoginStatee)` still works.
export const LoginStatee = AuthContext;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
