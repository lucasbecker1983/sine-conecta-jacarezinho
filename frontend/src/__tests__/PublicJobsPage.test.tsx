import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicJobsPage } from "../pages/PublicJobsPage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn() },
}));

const jobs = [
  {
    id: "job-1",
    title: "Atendente",
    company_name: "Empresa",
    is_confidential: false,
    city: "Jacarezinho",
    state: "PR",
    vacancies: 1,
    modality: "presencial",
    description: "Atendimento ao publico",
    created_at: "2026-05-20T00:00:00Z",
  },
];

describe("PublicJobsPage", () => {
  beforeEach(() => vi.mocked(api.get).mockResolvedValue({ data: jobs }));

  it("renderiza lista de vagas", async () => {
    render(<PublicJobsPage />, { wrapper: MemoryRouter });
    expect(await screen.findByText("Atendente")).toBeInTheDocument();
  });

  it("mostra estado vazio", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    render(<PublicJobsPage />, { wrapper: MemoryRouter });
    expect(await screen.findByText(/não encontramos vagas/i)).toBeInTheDocument();
  });

  it("aplica filtro de busca", async () => {
    render(<PublicJobsPage />, { wrapper: MemoryRouter });
    await screen.findByText("Atendente");
    await userEvent.type(screen.getByPlaceholderText(/buscar por cargo/i), "motorista");
    await waitFor(() => expect(screen.queryByText("Atendente")).not.toBeInTheDocument());
  });

  it("mostra empresa confidencial sem expor nome real", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ ...jobs[0], company_name: "Empresa confidencial", is_confidential: true }],
    });
    render(<PublicJobsPage />, { wrapper: MemoryRouter });
    expect((await screen.findAllByText(/empresa confidencial/i)).length).toBeGreaterThan(0);
    expect(screen.queryByText("Empresa Teste LTDA")).not.toBeInTheDocument();
  });
});
