import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsPage } from "../pages/ReportsPage";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";

vi.mock("../services/api", () => ({
  api: { get: vi.fn() },
}));

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ data: { vagas_ativas: 3, candidatos_cadastrados: 8 } });
  });

  it("mostra cards principais", async () => {
    useAuthStore.getState().setSession({ id: "1", email: "a@b.com", full_name: "Staff", roles: ["sine_staff"] }, null);
    render(<ReportsPage />);
    expect(await screen.findByText(/vagas ativas/i)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("nao mostra exportar para perfil sem permissao", async () => {
    useAuthStore.getState().setSession({ id: "1", email: "a@b.com", full_name: "Staff", roles: ["sine_staff"] }, null);
    render(<ReportsPage />);
    expect(await screen.findByText(/vagas ativas/i)).toBeInTheDocument();
    expect(screen.queryByText(/exportar csv/i)).not.toBeInTheDocument();
  });

  it("mostra exportar para sine_manager", async () => {
    useAuthStore.getState().setSession({ id: "1", email: "a@b.com", full_name: "Gestor", roles: ["sine_manager"] }, null);
    render(<ReportsPage />);
    expect(await screen.findByText(/exportar csv/i)).toBeInTheDocument();
  });
});
