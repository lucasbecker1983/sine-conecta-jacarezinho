import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyDashboard } from "../pages/CompanyDashboard";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn() },
}));

describe("CompanyDashboard", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/company-portal/status") {
        return Promise.resolve({
          data: {
            profile_complete: true,
            pending_returns: 1,
            can_open_job: false,
            blocking_reason: "Feedback pendente",
            ai_scope: "A IA é exclusiva do SINE",
          },
        });
      }
      if (url === "/company-portal/profile") return Promise.resolve({ data: { legal_name: "Empresa", lgpd_accepted: true } });
      if (url === "/company-portal/jobs") return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [{ id: "ref-1", job_title: "Atendente", worker_name: "Maria", status: "encaminhado", created_at: "2026-05-20T00:00:00Z" }] });
    });
  });

  it("mostra IA exclusiva do SINE e bloqueio amigavel", async () => {
    render(<CompanyDashboard />, { wrapper: MemoryRouter });
    expect(await screen.findByText(/ferramenta interna do SINE/i)).toBeInTheDocument();
    expect(screen.getByText(/bloqueado até registrar/i)).toBeInTheDocument();
    expect(screen.getByText(/registre o retorno/i)).toBeInTheDocument();
  });
});
