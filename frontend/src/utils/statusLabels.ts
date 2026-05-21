import { createElement } from "react";
import type { ReactNode } from "react";
import { AppBadge } from "../components/ui";

export const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  solicitada: "Solicitada pela empresa",
  em_analise: "Em análise pelo SINE",
  aprovada: "Aprovada pelo SINE",
  publicada: "Publicada para candidatos",
  em_triagem: "Em triagem pelo SINE",
  encaminhando_candidatos: "Encaminhando candidatos",
  aguardando_retorno_empresa: "Aguardando retorno da empresa",
  entrevistado: "Chamado para entrevista",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
  correcao_solicitada: "Correção solicitada",
  candidatura_trabalhador: "Candidatura enviada ao SINE",
  encaminhado: "Encaminhado à empresa",
  contratado: "Contratado",
  dispensado: "Não selecionado",
  nao_contratado: "Não selecionado",
  nao_compareceu: "Não compareceu",
  perfil_incompativel: "Perfil incompatível",
  vaga_preenchida: "Vaga preenchida",
  outro_motivo: "Outro motivo",
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
  if (["ativo", "contratado", "publicada", "aprovada", "concluida", "encerrada"].includes(status)) return "success";
  if (["aguardando_retorno_empresa", "em_analise", "em_triagem", "candidatura_trabalhador", "aberta"].includes(status)) return "warning";
  if (["cancelada", "dispensado", "nao_contratado", "nao_compareceu", "indeferida", "perfil_incompativel"].includes(status)) return "danger";
  return "info";
}

export const roleLabels: Record<string, string> = {
  super_admin: "Administrador geral",
  tenant_admin: "Gestor institucional",
  sine_manager: "Gestor do SINE",
  sine_staff: "Colaborador do SINE",
  company_user: "Empresa",
  worker: "Candidato",
};

export function roleLabel(role?: string | null) {
  if (!role) return "Usuário";
  return roleLabels[role] ?? role.replace(/_/g, " ");
}

export function primaryRoleLabel(roles?: string[] | null) {
  if (!roles?.length) return "Usuário";
  const priority = [
    "super_admin",
    "tenant_admin",
    "sine_manager",
    "sine_staff",
    "company_user",
    "worker",
  ];
  return roleLabel(priority.find((role) => roles.includes(role)) ?? roles[0]);
}

export function StatusBadge({ status }: { status?: string | null }): ReactNode {
  return createElement(AppBadge, {
    tone: statusTone(status),
    children: friendlyStatus(status),
  });
}
