import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SineJobTriagePage } from "../pages/SineJobTriagePage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

describe("SineJobTriagePage", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/jobs") return Promise.resolve({ data: [{ id: "job-1", company_id: "company-1", title: "Atendente", description: "Atendimento", vacancies: 1, status: "publicada", is_confidential: true, created_at: "2026-05-20T00:00:00Z" }] });
      if (url === "/companies") return Promise.resolve({ data: [{ id: "company-1", legal_name: "Empresa" }] });
      if (url.includes("/candidates")) return Promise.resolve({ data: [{ worker_id: "worker-1", worker_name: "Maria Silva", application_status: "candidatura_trabalhador", has_lgpd_consent: true, match_score: 70 }] });
      return Promise.resolve({ data: [] });
    });
    vi.mocked(api.post).mockResolvedValue({ data: { status: "ok" } });
  });

  it("mostra aviso de IA, candidatos e permite selecionar", async () => {
    render(
      <MemoryRouter initialEntries={["/sine/triagem/job-1"]}>
        <Routes>
          <Route path="/sine/triagem/:jobId" element={<SineJobTriagePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText(/a IA é apenas apoio à triagem/i)).toBeInTheDocument();
    expect(await screen.findByText(/vaga confidencial para candidatos/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Empresa/).length).toBeGreaterThan(0);
    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    const checkbox = screen.getByLabelText(/selecionar/i);
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
