import type { Company, CompanyForm, JobForm } from "./types";

export const regionalCities = [
  "Jacarezinho",
  "Cambará",
  "Andirá",
  "Bandeirantes",
  "Santo Antônio da Platina",
  "Ribeirão Claro",
  "Carlópolis",
  "Siqueira Campos",
  "Joaquim Távora",
  "Ibaiti",
  "Wenceslau Braz",
  "Tomazina",
  "Pinhalão",
  "Quatiguá",
  "Salto do Itararé",
  "Barra do Jacaré",
];

export const emptyCompany: CompanyForm = {
  cnpj: "",
  legal_name: "",
  trade_name: "",
  state_registration: "",
  federal_registration: "",
  city: "Jacarezinho",
  state: "PR",
  cep: "",
  email: "",
  phone: "",
  whatsapp: "",
  responsible_name: "",
  hr_responsible_name: "",
  segment: "",
  notes: "",
  lgpd_accepted: false,
};

export const emptyJob: JobForm = {
  title: "",
  description: "",
  vacancies: 1,
  start_date: "",
  closing_deadline: "",
  salary_range: "",
  benefits: "",
  workday: "",
  schedule: "",
  workplace: "",
  modality: "presencial",
  minimum_education: "",
  required_experience: "",
  desired_courses: "",
  cnh_required: "",
  contract_type: "",
  notes: "",
  travel_required: false,
};

export const finalFeedbackOptions = [
  { value: "contratado", label: "Contratado" },
  { value: "dispensado", label: "Não selecionado" },
  { value: "nao_compareceu", label: "Não compareceu" },
  { value: "banco_futuro", label: "Manter no banco de talentos" },
  { value: "sem_interesse", label: "Candidato sem interesse" },
];

export function asCompanyForm(company: Company | null): CompanyForm {
  if (!company) return emptyCompany;
  return {
    cnpj: company.cnpj ?? "",
    legal_name: company.legal_name ?? "",
    trade_name: company.trade_name ?? "",
    state_registration: company.state_registration ?? "",
    federal_registration: company.federal_registration ?? "",
    city: company.city ?? "Jacarezinho",
    state: company.state ?? "PR",
    cep: company.cep ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    whatsapp: company.whatsapp ?? "",
    responsible_name: company.responsible_name ?? "",
    hr_responsible_name: company.hr_responsible_name ?? "",
    segment: company.segment ?? "",
    notes: company.notes ?? "",
    lgpd_accepted: company.lgpd_accepted,
  };
}
