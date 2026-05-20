import type { Tenant } from "../types";
import { tenantToTheme } from "./tenantTheme";

export function applyTenantTheme(tenant: Tenant) {
  const theme = tenantToTheme(tenant);
  const root = document.documentElement;
  root.style.setProperty("--tenant-primary", theme.primaryColor);
  root.style.setProperty("--tenant-secondary", theme.secondaryColor);
  root.style.setProperty("--tenant-accent", theme.accentColor);
  root.style.setProperty("--tenant-background", theme.backgroundColor);
}
