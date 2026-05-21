import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CompanyJobsPage,
  CompanyReferralsPage,
} from "../pages/CompanyDashboard";
import { WorkerJobsPage } from "../pages/WorkerJobsPage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const openJobs = [
  {
    id: "job-1",
    title: "Atendente",
    description: "Atendimento ao público e organização de balcão.",
    vacancies: 2,
    salary_range: "R$ 1.800,00",
    workplace: "Centro",
    modality: "presencial",
    minimum_education: "Ensino médio",
    status: "publicada",
    is_confidential: true,
    company_name: "Empresa confidencial",
    city: "Jacarezinho",
    state: "PR",
  },
];

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderWithRoutes(element: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/vagas-abertas"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              {element}
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

function mockCompanyPortal({
  pendingReturns = 0,
  referrals = [],
  jobs = [],
}: {
  pendingReturns?: number;
  referrals?: any[];
  jobs?: any[];
}) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === "/company-portal/status") {
      return Promise.resolve({
        data: {
          profile_complete: true,
          pending_returns: pendingReturns,
          pending_feedbacks: pendingReturns
            ? [
                {
                  referral_id: "ref-1",
                  job_id: "job-1",
                  job_title: "Atendente",
                  worker_name: "Maria",
                  status: "encaminhado",
                },
              ]
            : [],
          can_open_job: pendingReturns === 0,
          blocking_reason: pendingReturns ? "Retorno pendente" : null,
          ai_scope: "A IA é exclusiva do SINE",
        },
      });
    }
    if (url === "/company-portal/profile") {
      return Promise.resolve({ data: { legal_name: "Empresa", lgpd_accepted: true } });
    }
    if (url === "/company-portal/jobs") return Promise.resolve({ data: jobs });
    if (url === "/company-portal/referrals") return Promise.resolve({ data: referrals });
    return Promise.resolve({ data: [] });
  });
}

describe("WorkerJobsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/worker-portal/open-jobs") return Promise.resolve({ data: openJobs });
      if (url === "/worker-portal/applications") {
        return Promise.resolve({
          data: [
            {
              id: "app-1",
              job_id: "job-1",
              job_title: "Atendente",
              status: "aguardando_retorno_empresa",
              created_at: "2026-05-20T00:00:00Z",
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("navega para o currículo com a vaga selecionada", async () => {
    renderWithRoutes(<WorkerJobsPage />);
    await screen.findByText("Atendimento ao público e organização de balcão.");

    await userEvent.selectOptions(screen.getByLabelText(/vaga selecionada/i), "job-1");
    await userEvent.click(screen.getByRole("button", { name: /quero me candidatar/i }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/meu-curriculo?vaga=job-1",
    );
  });

  it("mostra mensagem amigável se nenhuma vaga estiver selecionada", async () => {
    renderWithRoutes(<WorkerJobsPage />);
    await screen.findByText("Atendimento ao público e organização de balcão.");

    await userEvent.click(screen.getByRole("button", { name: /quero me candidatar/i }));

    expect(
      screen.getByText(/escolha uma vaga antes de continuar/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/vagas-abertas");
  });

  it("não mostra status técnico cru", async () => {
    renderWithRoutes(<WorkerJobsPage />);

    expect(await screen.findByText(/aguardando retorno da empresa/i)).toBeInTheDocument();
    expect(screen.queryByText("aguardando_retorno_empresa")).not.toBeInTheDocument();
  });

  it("não exibe nome real da empresa quando a vaga é confidencial", async () => {
    renderWithRoutes(<WorkerJobsPage />);

    expect((await screen.findAllByText(/empresa confidencial/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/empresa real ltda/i)).not.toBeInTheDocument();
  });
});

describe("Company portal pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.post).mockResolvedValue({ data: { status: "ok" } });
    vi.mocked(api.patch).mockResolvedValue({ data: { status: "ok" } });
  });

  it("CompanyJobsPage exibe opção de confidencialidade no formulário", async () => {
    mockCompanyPortal({});

    render(<CompanyJobsPage />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/confidencialidade da vaga/i)).toBeInTheDocument();
    expect(screen.getByText(/manter empresa confidencial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/manter empresa confidencial/i)).toBeChecked();
  });

  it("CompanyJobsPage mostra badge de confidencialidade no histórico", async () => {
    mockCompanyPortal({
      jobs: [
        {
          id: "job-1",
          title: "Atendente",
          description: "Atendimento",
          vacancies: 1,
          modality: "presencial",
          status: "publicada",
          is_confidential: true,
          travel_required: false,
          created_at: "2026-05-20T00:00:00Z",
        },
      ],
    });

    render(<CompanyJobsPage />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/confidencial para candidatos/i)).toBeInTheDocument();
  });

  it("CompanyJobsPage mostra bloqueio quando há pending_returns", async () => {
    mockCompanyPortal({ pendingReturns: 1 });

    render(<CompanyJobsPage />, { wrapper: MemoryRouter });

    expect(
      await screen.findByText(/abertura de vagas temporariamente suspensa/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar vaga ao sine/i })).toBeDisabled();
  });

  it("CompanyReferralsPage permite registrar feedback", async () => {
    mockCompanyPortal({
      referrals: [
        {
          id: "ref-1",
          job_title: "Atendente",
          worker_name: "Maria",
          worker_email: "maria@example.com",
          worker_phone: "43999990000",
          resume_filename: "maria.pdf",
          status: "encaminhado",
          match_score: 88,
          created_at: "2026-05-20T00:00:00Z",
        },
      ],
    });

    render(<CompanyReferralsPage />, { wrapper: MemoryRouter });

    await screen.findByText("Maria");
    await userEvent.click(screen.getByRole("button", { name: /registrar retorno final/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/company-portal/referrals/ref-1/feedback",
        { status: "contratado", comments: "" },
      ),
    );
    expect(await screen.findByText(/retorno final registrado/i)).toBeInTheDocument();
  });
});
