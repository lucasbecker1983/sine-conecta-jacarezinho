import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "../layouts/AppLayout";
import {
  ResumeBankPage,
  ResumeBankSuggestionsPage,
  WorkerResumeBankPage,
} from "../pages/ResumeBankPage";
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

const entry = {
  id: "entry-1",
  worker_id: "worker-1",
  worker_name: "Maria Silva",
  worker_cpf_masked: "***.***.***-11",
  resume_id: "resume-1",
  resume_filename: "maria.pdf",
  status: "ativo",
  entry_reason: "atualizacao_manual_sine",
  tags: ["atendimento"],
  desired_roles: ["Atendente"],
  desired_sectors: ["Comercio"],
  availability: "Imediata",
  city: "Jacarezinho",
  education_level: "Ensino médio",
  experience_summary: "Experiência em atendimento ao público.",
  ai_summary: null,
  ai_keywords: [],
  internal_notes: "Observação interna",
  created_at: "2026-05-20T00:00:00Z",
  updated_at: "2026-05-21T00:00:00Z",
};

const suggestion = {
  id: "suggestion-1",
  job_id: "job-1",
  job_title: "Atendente",
  resume_bank_entry_id: "entry-1",
  worker_id: "worker-1",
  worker_name: "Maria Silva",
  resume_id: "resume-1",
  resume_filename: "maria.pdf",
  desired_role: "Atendente",
  city: "Jacarezinho",
  education_level: "Ensino médio",
  professional_summary: "Atendimento ao público.",
  compatibility_score: 88,
  compatibility_level: "alta",
  matched_requirements: ["Atendimento"],
  missing_requirements: ["Conferir disponibilidade"],
  ai_explanation: "Perfil compatível com a vaga.",
  status: "pendente_revisao",
  created_at: "2026-05-21T00:00:00Z",
};

function mockResumeBankApi() {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === "/resume-bank") return Promise.resolve({ data: [entry] });
    if (url === "/workers") {
      return Promise.resolve({
        data: [
          {
            id: "worker-1",
            tenant_id: "tenant-1",
            cpf: "00000000011",
            full_name: "Maria Silva",
            desired_role: "Atendente",
            city: "Jacarezinho",
            lgpd_accepted: true,
            created_at: "2026-05-20T00:00:00Z",
          },
        ],
      });
    }
    if (url === "/resume-bank/suggestions" || url === "/resume-bank/suggestions/job/job-1") {
      return Promise.resolve({ data: [suggestion] });
    }
    if (url === "/jobs") return Promise.resolve({ data: [{ id: "job-1", title: "Atendente" }] });
    if (url === "/worker-portal/resume-bank/me") {
      return Promise.resolve({
        data: {
          status: "ativo",
          entered_at: "2026-05-20T00:00:00Z",
          updated_at: "2026-05-21T00:00:00Z",
          desired_roles: ["Atendente"],
          message:
            "Seu currículo está no Banco de Currículos do SINE Jacarezinho e poderá ser considerado para futuras oportunidades compatíveis.",
        },
      });
    }
    if (url === "/notifications/summary") return Promise.resolve({ data: { unread: 0 } });
    if (url === "/notifications") return Promise.resolve({ data: [] });
    return Promise.resolve({ data: [] });
  });
  vi.mocked(api.post).mockResolvedValue({ data: { total_suggestions: 1 } });
  vi.mocked(api.patch).mockResolvedValue({ data: suggestion });
}

describe("Banco de Currículos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useAuthStore.getState().logout();
    });
    localStorage.removeItem("sine_access_token");
    mockResumeBankApi();
  });

  it("SINE vê menu Banco de Currículos e empresa não vê", async () => {
    act(() => {
      useAuthStore.getState().setSession(
        { id: "1", email: "sine@example.com", full_name: "SINE", roles: ["sine_staff"] },
        null,
      );
    });
    const { rerender } = render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>Conteúdo</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Banco de Currículos")).toBeInTheDocument();

    act(() => {
      useAuthStore.getState().setSession(
        { id: "2", email: "empresa@example.com", full_name: "Empresa", roles: ["company_user"] },
        null,
      );
    });
    rerender(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>Conteúdo</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Banco de Currículos")).not.toBeInTheDocument();
  });

  it("SINE lista, filtra e adiciona entrada", async () => {
    render(<ResumeBankPage />, { wrapper: MemoryRouter });

    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Buscar"), "Maria");
    await userEvent.click(screen.getByRole("button", { name: /filtrar/i }));
    expect(api.get).toHaveBeenCalledWith("/resume-bank", expect.objectContaining({ params: expect.objectContaining({ search: "Maria" }) }));

    await userEvent.selectOptions(screen.getByLabelText("Candidato"), "worker-1");
    await userEvent.click(screen.getByRole("button", { name: /adicionar ao banco de currículos/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/resume-bank", expect.objectContaining({ worker_id: "worker-1" })));
  });

  it("SINE revisa sugestões da IA e encaminha explicitamente", async () => {
    render(
      <MemoryRouter initialEntries={["/banco-curriculos/vaga/job-1/sugestoes"]}>
        <Routes>
          <Route path="/banco-curriculos/vaga/:jobId/sugestoes" element={<ResumeBankSuggestionsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /aprovar sugestão/i }));
    expect(api.patch).toHaveBeenCalledWith("/resume-bank/suggestions/suggestion-1/review", { status: "aprovado_pelo_sine" });

    await userEvent.click(screen.getByRole("button", { name: /encaminhar para empresa/i }));
    expect(api.post).toHaveBeenCalledWith("/resume-bank/suggestions/suggestion-1/forward");
  });

  it("trabalhador vê apenas a própria situação sem pontuação ou observações internas", async () => {
    render(<WorkerResumeBankPage />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/futuras oportunidades compatíveis/i)).toBeInTheDocument();
    expect(screen.getByText(/ativo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Observação interna/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/88/)).not.toBeInTheDocument();
    expect(screen.queryByText(/compatibility/i)).not.toBeInTheDocument();
  });
});
