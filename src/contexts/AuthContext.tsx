import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authApi, type ApiUser } from "@/lib/api";

export type UserRole = "tourist" | "host" | "guide" | "admin" | "chef";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isApproved: boolean;
  onboardingCompleted?: boolean;
  profileImage?: string;
  status?: string;
  isNew?: boolean;
  isNewUser?: boolean;
  token?: string;
  avatar?: string;
  sessionExpiresAt?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  authWithGoogle: (role: UserRole, mode: "signin" | "signup", token?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  updateProfile: (updates: Partial<Pick<AuthUser, "name" | "email" | "avatar" | "profileImage">>) => void;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

const STORAGE_KEY = "user";

const toRole = (role: string | undefined): UserRole => {
  const lowered = (role || "tourist").toLowerCase();
  if (["tourist", "host", "guide", "admin", "chef"].includes(lowered)) {
    return lowered as UserRole;
  }
  return "tourist";
};

const normalizeVerification = (role: UserRole, status?: string, isVerified?: boolean): boolean => {
  if (typeof isVerified === "boolean") {
    return isVerified;
  }

  if (!["host", "guide", "chef"].includes(role)) {
    return true;
  }

  const normalizedStatus = String(status || "").trim().toUpperCase();
  return normalizedStatus === "APPROVED" || normalizedStatus === "ACTIVE";
};

const mapApiUser = (data: ApiUser): AuthUser => ({
  id: String(data.id),
  name: data.name,
  email: data.email,
  role: toRole(data.role),
  isVerified: normalizeVerification(toRole(data.role), data.status, data.isVerified),
  isApproved: data.isApproved ?? (toRole(data.role) === "tourist" ? true : normalizeVerification(toRole(data.role), data.status, data.isVerified)),
  onboardingCompleted: true,
  profileImage: data.profileImage,
  avatar: data.profileImage,
  status: data.status,
  isNew: data.isNew ?? data.isNewUser,
  isNewUser: data.isNewUser ?? data.isNew ?? false,
  token: data.token,
  sessionExpiresAt: Date.now() + SESSION_DURATION_MS,
});

const initialUser = (): AuthUser | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.token || !parsed?.sessionExpiresAt || parsed.sessionExpiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      ...parsed,
      id: String(parsed.id),
      isVerified: typeof parsed.isVerified === "boolean" ? parsed.isVerified : normalizeVerification(parsed.role, parsed.status, undefined),
      isApproved: typeof parsed.isApproved === "boolean" ? parsed.isApproved : normalizeVerification(parsed.role, parsed.status, undefined),
      onboardingCompleted: true,
      isNewUser: parsed.isNewUser ?? parsed.isNew ?? false,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  const persistUser = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (!nextUser) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("token");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    if (nextUser.token) {
      localStorage.setItem("token", nextUser.token);
    }
  };

  const login = async (email: string, password: string, role: UserRole) => {
    const response = await authApi.login({ email, password });
    const normalized = mapApiUser(response as ApiUser);

    if (normalized.role !== role) {
      throw new Error(`This account belongs to ${normalized.role.toUpperCase()} role.`);
    }

    persistUser(normalized);
  };

  const signup = async (data: SignupData) => {
    const response = await authApi.register({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role.toUpperCase(),
      phone: data.phone,
    });
    const created = mapApiUser(response as ApiUser);
    const requiresApproval = ["host", "guide", "chef"].includes(created.role);
    persistUser({
      ...created,
      isVerified: requiresApproval ? false : created.isVerified,
      isApproved: created.role === "tourist" ? true : false,
      onboardingCompleted: true,
      isNew: false,
      isNewUser: false,
      status: created.status || (requiresApproval ? "PENDING" : "APPROVED"),
    });
  };

  const authWithGoogle = async (role: UserRole, mode: "signin" | "signup", token?: string) => {
    if (!token) {
      throw new Error("Google OAuth token missing. Integrate Google login button token callback.");
    }
    const response = await authApi.google(token, role.toUpperCase());
    const normalized = mapApiUser(response as ApiUser);
    if (mode === "signin" && normalized.role !== role) {
      throw new Error(`This Google account belongs to ${normalized.role.toUpperCase()} role.`);
    }
    persistUser(normalized);
  };

  const logout = () => {
    persistUser(null);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (!user) {
      return;
    }
    const next = {
      ...user,
      ...updates,
      avatar: updates.avatar ?? updates.profileImage ?? user.avatar,
      profileImage: updates.profileImage ?? updates.avatar ?? user.profileImage,
      sessionExpiresAt: user.sessionExpiresAt ?? Date.now() + SESSION_DURATION_MS,
    };
    persistUser(next);
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoggedIn: Boolean(user),
    login,
    signup,
    authWithGoogle,
    logout,
    updateUser,
    updateProfile: updateUser,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
