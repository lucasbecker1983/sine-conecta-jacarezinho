import sineLogo from "../assets/logos/sine-logo.png";
import type { Tenant } from "../types";

export type TenantTheme = {
  tenantName: string;
  visibleName: string;
  portalName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  footerText: string;
};

export const defaultTenantTheme: TenantTheme = {
  tenantName: "SINE Jacarezinho",
  visibleName: "SINE Conecta Jacarezinho",
  portalName: "SINE Conecta",
  tagline: "Conectando candidatos, empresas e oportunidades com cuidado e transparência.",
  logoUrl: sineLogo,
  primaryColor: "#14532d",
  secondaryColor: "#0f766e",
  accentColor: "#f59e0b",
  backgroundColor: "#f4f7f5",
  footerText: "Prefeitura Municipal de Jacarezinho",
};

export function tenantToTheme(tenant?: Tenant | null): TenantTheme {
  if (!tenant) return defaultTenantTheme;
  return {
    ...defaultTenantTheme,
    tenantName: tenant.name || defaultTenantTheme.tenantName,
    visibleName: tenant.name?.includes("Conecta") ? tenant.name : "SINE Conecta Jacarezinho",
    logoUrl: tenant.logo_url || defaultTenantTheme.logoUrl,
    primaryColor: tenant.primary_color || defaultTenantTheme.primaryColor,
    secondaryColor: tenant.secondary_color || defaultTenantTheme.secondaryColor,
    accentColor: tenant.accent_color || defaultTenantTheme.accentColor,
    footerText: tenant.footer_text || defaultTenantTheme.footerText,
  };
}
