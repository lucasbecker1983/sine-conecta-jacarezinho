import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrivacyNoticeBox } from "../components/lgpd/PrivacyNoticeBox";
import { CompanyPrivacyPage } from "../pages/CompanyPrivacyPage";
import { LgpdAdminPage } from "../pages/LgpdAdminPage";
import { LgpdRequestPage } from "../pages/LgpdRequestPage";
import { LgpdRightsPage } from "../pages/LgpdRightsPage";
import { WorkerPrivacyPage } from "../pages/WorkerPrivacyPage";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

function withRouter(element: ReactElement) {
  return <MemoryRouter>{element}</MemoryRouter>;
}

describe("LGPD pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it("LgpdRightsPage renderiza explicações principais", () => {
    render(withRouter(<LgpdRightsPage />));
    expect(screen.getByText(/Direitos do titular de dados/i)).toBeInTheDocument();
    expect(screen.getByText(/quando a empresa recebe dados/i)).toBeInTheDocument();
    expect(screen.getByText(/decisão final é humana/i)).toBeInTheDocument();
  });

  it("LgpdRequestPage valida campos obrigatórios", async () => {
    render(withRouter(<LgpdRequestPage />));
    fireEvent.click(screen.getByRole("button", { name: /enviar solicitação/i }));
    await waitFor(() => expect(api.post).not.toHaveBeenCalled());
  });

  it("WorkerPrivacyPage mostra consentimentos mockados", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: [
          {
            id: "1",
            consent_type: "worker_privacy_notice",
            consent_status: "accepted",
            term_title: "Aviso de Privacidade do Trabalhador",
            term_version: "1.0",
            purpose: "Cadastro e candidatura",
            accepted_at: new Date().toISOString(),
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });
    render(withRouter(<WorkerPrivacyPage />));
    expect(await screen.findByText(/Aviso de Privacidade do Trabalhador/i)).toBeInTheDocument();
  });

  it("CompanyPrivacyPage mostra orientação de uso de dados", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });
    render(withRouter(<CompanyPrivacyPage />));
    expect(await screen.findByText(/não devem ser usados para outras finalidades/i)).toBeInTheDocument();
  });

  it("LgpdAdminPage mostra abas para perfil autorizado", async () => {
    useAuthStore.getState().setSession({ id: "1", email: "gestor@example.com", full_name: "Gestor", roles: ["sine_manager"] }, null);
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { open_requests: 2, active_consents: 4 } })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });
    render(<LgpdAdminPage />);
    expect(await screen.findByText(/Painel do encarregado/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Solicitações dos titulares/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Incidentes/i })).toBeInTheDocument();
  });

  it("LgpdAdminPage bloqueia perfil sem permissão", () => {
    useAuthStore.getState().setSession({ id: "1", email: "empresa@example.com", full_name: "Empresa", roles: ["company_user"] }, null);
    render(<LgpdAdminPage />);
    expect(screen.getByText(/Você não tem permissão/i)).toBeInTheDocument();
  });

  it("PrivacyNoticeBox renderiza aviso de IA interna", () => {
    render(<PrivacyNoticeBox variant="triage" />);
    expect(screen.getByText(/A IA é usada exclusivamente como apoio interno do SINE/i)).toBeInTheDocument();
  });
});
