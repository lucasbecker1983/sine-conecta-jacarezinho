import type { Company, Job } from "../../types";

export type { Company, Job };

export type CompanyForm = {
  cnpj: string;
  legal_name: string;
  trade_name: string;
  state_registration: string;
  federal_registration: string;
  city: string;
  state: string;
  cep: string;
  email: string;
  phone: string;
  whatsapp: string;
  responsible_name: string;
  hr_responsible_name: string;
  segment: string;
  notes: string;
  lgpd_accepted: boolean;
};

export type JobForm = {
  title: string;
  description: string;
  vacancies: number;
  start_date: string;
  closing_deadline: string;
  salary_range: string;
  benefits: string;
  workday: string;
  schedule: string;
  workplace: string;
  modality: string;
  minimum_education: string;
  required_experience: string;
  desired_courses: string;
  cnh_required: string;
  contract_type: string;
  notes: string;
  travel_required: boolean;
};

export type PendingFeedback = {
  referral_id: string;
  job_id: string;
  job_title: string;
  worker_name: string;
  status: string;
  created_at?: string | null;
};

export type PortalStatus = {
  profile_complete: boolean;
  pending_returns: number;
  pending_feedbacks?: PendingFeedback[];
  can_open_job: boolean;
  blocking_reason?: string | null;
  ai_scope: string;
};

export type CompanyReferral = {
  id: string;
  job_title: string;
  worker_name: string;
  worker_email?: string | null;
  worker_phone?: string | null;
  worker_whatsapp?: string | null;
  resume_filename?: string | null;
  status: string;
  match_score?: number | null;
  created_at: string;
};
