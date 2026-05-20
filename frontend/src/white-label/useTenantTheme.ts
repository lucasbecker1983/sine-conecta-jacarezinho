import { useMemo } from "react";
import { useAuthStore } from "../stores/auth";
import { defaultTenantTheme, tenantToTheme } from "./tenantTheme";

export function useTenantTheme() {
  const tenant = useAuthStore((state) => state.tenant);
  return useMemo(() => tenantToTheme(tenant) ?? defaultTenantTheme, [tenant]);
}
