import { createElement } from "react";
import type { ReactNode } from "react";
import { AppBadge } from "../components/ui";

export const statusLabels: Record<string, string> = {
  solicitada: "Solicitada pela empresa",
  em_analise: "Em análise pelo SINE",
  aprovada: "Aprovada pelo SINE",
  publicada: "Publicada para trabalhadores",
  em_triagem: "Em triagem pelo SINE",
  encaminhando_candidatos: "Encaminhando candidatos",
  aguardando_retorno_empresa: "Aguardando retorno da empresa",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
  correcao_solicitada: "Correção solicitada",
  candidatura_trabalhador: "Candidatura enviada ao SINE",
  encaminhado: "Encaminhado à empresa",
  contratado: "Contratado",
  dispensado: "Não selecionado",
  nao_contratado: "Não selecionado",
  nao_compareceu: "Não compareceu",
  banco_futuro: "Banco de talentos",
  banco_talentos: "Banco de talentos",
  sem_interesse: "Sem interesse",
  aberta: "Aberta",
  concluida: "Concluída",
};

export function friendlyStatus(status?: string | null) {
  if (!status) return "Não informado";
  return statusLabels[status] ?? status.replace(/_/g, " ");
}

export function statusTone(status?: string | null): "neutral" | "success" | "warning" | "danger" | "info" {
  if (!status) return "neutral";
  if (["contratado", "publicada", "aprovada", "concluida", "encerrada"].includes(status)) return "success";
  if (["aguardando_retorno_empresa", "em_analise", "em_triagem", "candidatura_trabalhador", "aberta"].includes(status)) return "warning";
  if (["cancelada", "dispensado", "nao_contratado", "nao_compareceu", "indeferida"].includes(status)) return "danger";
  return "info";
}

export function StatusBadge({ status }: { status?: string | null }): ReactNode {
  return createElement(AppBadge, {
    tone: statusTone(status),
    children: friendlyStatus(status),
  });
}
