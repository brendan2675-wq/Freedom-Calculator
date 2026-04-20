import { useEffect, useState } from "react";

export type Role = "client" | "adviser" | "agent";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const ROLE_KEY = "auth-role";
const USER_KEY = "auth-user";

export function getRole(): Role | null {
  const r = localStorage.getItem(ROLE_KEY);
  if (r === "client" || r === "adviser" || r === "agent") return r;
  return null;
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: AuthUser) {
  localStorage.setItem(ROLE_KEY, user.role);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Mirror name into existing client-name field for header continuity
  localStorage.setItem("client-name", user.name);
  window.dispatchEvent(new Event("auth-changed"));
}

export function logout() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth-changed"));
}

export function landingFor(role: Role): string {
  if (role === "adviser") return "/adviser";
  if (role === "agent") return "/agent";
  return "/";
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getUser());
  const [role, setRole] = useState<Role | null>(getRole());

  useEffect(() => {
    const sync = () => {
      setUser(getUser());
      setRole(getRole());
    };
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, role, isAuthed: !!role, logout };
}
