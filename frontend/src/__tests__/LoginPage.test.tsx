import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Login } from "../pages/Login";

vi.mock("../services/api", () => ({
  getCurrentTenant: vi.fn().mockResolvedValue({}),
  login: vi.fn().mockResolvedValue({ user: { id: "1", full_name: "Teste", email: "t@sine", roles: ["sine_staff"] }, tenant: null }),
}));

describe("LoginPage", () => {
  it("renderiza formulario e links principais", () => {
    render(<Login />, { wrapper: MemoryRouter });
    expect(screen.getByRole("heading", { name: /entrar na plataforma/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByText(/ver vagas abertas/i)).toBeInTheDocument();
    expect(screen.getByText(/sou trabalhador e quero me cadastrar/i)).toBeInTheDocument();
    expect(screen.getByText(/sou empresa e quero solicitar vagas/i)).toBeInTheDocument();
  });

  it("valida campos obrigatorios", async () => {
    render(<Login />, { wrapper: MemoryRouter });
    await userEvent.clear(screen.getByLabelText(/e-mail/i));
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    expect(screen.getByLabelText(/e-mail/i)).toBeInvalid();
  });
});
