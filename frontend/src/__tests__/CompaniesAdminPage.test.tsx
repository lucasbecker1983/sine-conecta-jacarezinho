import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "../layouts/AppLayout";
import { CompaniesPage } from "../pages/companies/CompaniesPage";
import { CompanyDetailPage } from "../pages/companies/CompanyDetailPage";
import { api } from "../services/api";
import { useAuthStore } from "../stores/auth";

vi.mock("../services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  getCurrentTenant: vi.fn(() => Promise.resolve(null)),
}));

const company = {
  id: "company-1",
  tenant_id: "tenant-1",
  cnpj: "12345678000190",
  legal_name: "Empresa Teste LTDA",
  trade_name: "Empresa Teste",
  email: "rh@empresa.test",
  phone: "4333333333",
  whatsapp: "43999999999",
  address: "Rua Central",
  address_number: "123",
  address_complement: "Sala 2",
  district: "Centro",
  city: "Jacarezinho",
  state: "PR",
  cep: "86400000",
  responsible_name: "Ana RH",
  responsible_position: "Gerente de RH",
  responsible_email: "ana@empresa.test",
  responsible_phone: "43988888888",
  hr_responsible_name: "Ana RH",
  segment: "Comércio",
  company_size: "Pequena empresa",
  cnae: "4711-3/02",
  notes: null,
  lgpd_accepted: true,
  lgpd_accepted_at: "2026-05-20T00:00:00Z",
  status: "ativa",
  profile_complete: true,
  approved_at: "2026-05-20T00:00:00Z",
  blocked_at: null,
  blocking_reason: null,
  created_at: "2026-05-20T00:00:00Z",
  updated_at: "2026-05-21T00:00:00Z",
};

const listItem = {
  ...company,
  open_jobs: 1,
  total_jobs: 2,
  pending_feedbacks: 1,
  referrals_count: 3,
  last_activity_at: "2026-05-21T00:00:00Z",
  blocked: true,
};

const detail = {
  ...company,
  internal_notes: "Observação interna do SINE",
  summary: {
    open_jobs: 1,
    closed_jobs: 1,
    referrals_received: 3,
    pending_feedbacks: 1,
    hires_reported: 1,
    days_since_last_return: 2,
    regularity_status: "Empresa em atenção",
    blocking_reason: "Feedbacks pendentes impedem novas vagas.",
  },
  jobs: [
    {
      id: "job-1",
      title: "Atendente",
      status: "publicada",
      is_confidential: true,
      vacancies: 2,
      created_at: "2026-05-20T00:00:00Z",
      pending_feedbacks: 1,
    },
  ],
  referrals: [
    {
      id: "ref-1",
      job_id: "job-1",
      job_title: "Atendente",
      worker_id: "worker-1",
      worker_name: "Maria Silva",
      status: "encaminhado",
      feedback_status: "aguardando_retorno_empresa",
      created_at: "2026-05-20T00:00:00Z",
    },
  ],
  feedbacks: [
    {
      id: null,
      referral_id: "ref-1",
      job_title: "Atendente",
      worker_name: "Maria Silva",
      status: "aguardando_retorno_empresa",
      comments: null,
      pending: true,
      created_at: "2026-05-20T00:00:00Z",
    },
  ],
  audit: [
    {
      id: "audit-1",
      action: "company_viewed_by_sine",
      user_id: "user-1",
      details: {},
      created_at: "2026-05-21T00:00:00Z",
    },
  ],
};

function mockApi() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === "/companies") return Promise.resolve({ data: [listItem] });
    if (url === "/companies/company-1") return Promise.resolve({ data: detail });
    return Promise.resolve({ data: [] });
  });
  vi.mocked(api.post).mockResolvedValue({ data: detail });
  vi.mocked(api.patch).mockResolvedValue({ data: { ...detail, status: "bloqueada" } });
}

describe("Módulo administrativo de empresas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem("sine_access_token");
    mockApi();
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it("SINE vê menu Empresas e empresa/trabalhador não veem", async () => {
    act(() => {
      useAuthStore.getState().setSession({ id: "1", email: "sine@test", full_name: "SINE", roles: ["sine_staff"] }, null);
    });
    const { rerender } = render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Empresas")).toBeInTheDocument();

    act(() => {
      useAuthStore.getState().setSession({ id: "2", email: "empresa@test", full_name: "Empresa", roles: ["company_user"] }, null);
    });
    rerender(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Empresas")).not.toBeInTheDocument();

    act(() => {
      useAuthStore.getState().setSession({ id: "3", email: "worker@test", full_name: "Candidato", roles: ["worker"] }, null);
    });
    rerender(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.queryByText("Empresas")).not.toBeInTheDocument();
  });

  it("SINE abre listagem e navega para detalhes", async () => {
    render(
      <MemoryRouter initialEntries={["/empresas"]}>
        <Routes>
          <Route path="/empresas" element={<CompaniesPage />} />
          <Route path="/empresas/:id" element={<CompanyDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect((await screen.findAllByText("Empresa Teste")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Empresa ativa/i).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: /ver detalhes/i }));

    expect(await screen.findByText(/Histórico operacional da empresa/i)).toBeInTheDocument();
    expect(screen.getByText("Empresa Teste LTDA · 12345678000190")).toBeInTheDocument();
  });

  it("detalhe mostra dados, vagas, feedbacks, observações internas e auditoria sem status técnico cru", async () => {
    render(
      <MemoryRouter initialEntries={["/empresas/company-1"]}>
        <Routes>
          <Route path="/empresas/:id" element={<CompanyDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Empresa Teste LTDA · 12345678000190")).toBeInTheDocument();
    expect(screen.getByText(/Feedbacks pendentes impedem novas vagas/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /responsável e contatos/i }));
    expect(screen.getByText("Ana RH")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /vagas/i }));
    expect(screen.getByText("Atendente")).toBeInTheDocument();
    expect(screen.getByText(/confidencial para candidatos/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /feedbacks/i }));
    expect(screen.getByText(/Feedback pendente/i)).toBeInTheDocument();
    expect(screen.queryByText("aguardando_retorno_empresa")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /observações internas/i }));
    expect(screen.getAllByText(/Observação interna do SINE/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("tab", { name: /auditoria/i }));
    expect(screen.getByText(/Empresa visualizada pelo SINE/i)).toBeInTheDocument();
  });

  it("permite adicionar observação interna e alterar status", async () => {
    render(
      <MemoryRouter initialEntries={["/empresas/company-1"]}>
        <Routes>
          <Route path="/empresas/:id" element={<CompanyDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("Empresa Teste LTDA · 12345678000190");
    await userEvent.selectOptions(screen.getByLabelText(/alterar status/i), "bloqueada");
    await userEvent.type(screen.getByLabelText(/motivo ou orientação/i), "Pendência documental");
    await userEvent.click(screen.getByRole("button", { name: /alterar status/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/companies/company-1/status", { status: "bloqueada", reason: expect.stringContaining("Pendência documental") }));

    await userEvent.click(screen.getByRole("tab", { name: /observações internas/i }));
    await userEvent.type(screen.getByLabelText(/observação interna do sine/i), "Nova observação");
    await userEvent.click(screen.getByRole("button", { name: /adicionar observação/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/companies/company-1/notes", { note: "Nova observação" }));
  });
});
