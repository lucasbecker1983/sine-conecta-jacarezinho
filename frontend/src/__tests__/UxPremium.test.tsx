import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingChecklist } from "../components/onboarding/OnboardingChecklist";
import { StatusBadge } from "../utils/statusLabels";

describe("UX premium components", () => {
  it("renderiza checklist de onboarding por perfil", () => {
    render(<OnboardingChecklist role="worker" />);
    expect(screen.getByText(/complete seu cadastro/i)).toBeInTheDocument();
    expect(screen.getByText(/acompanhe status/i)).toBeInTheDocument();
  });

  it("exibe textos amigaveis para status tecnico", () => {
    render(<>{StatusBadge({ status: "em_analise" })}</>);
    expect(screen.getByText(/em análise pelo sine/i)).toBeInTheDocument();
  });
});
