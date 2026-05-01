import type { UserRole } from "@/contexts/AuthContext";

export const AUTH_PATH = "/auth";

export const dashboardPathByRole: Record<UserRole, string> = {
  tourist: "/home",
  host: "/host-dashboard",
  guide: "/guide-dashboard",
  chef: "/chef-dashboard",
  admin: "/admin-dashboard",
};

export const getDashboardPath = (role: UserRole) => dashboardPathByRole[role];
