export type Tenant = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  domain: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  footer_text: string;
};

export type User = {
  id: string;
  tenant_id?: string;
  email: string;
  full_name: string;
  roles: string[];
};

export type Summary = Record<string, number>;

export type Company = {
  id: string;
  tenant_id: string;
  cnpj: string;
  legal_name: string;
  trade_name?: string | null;
  state_registration?: string | null;
  federal_registration?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  responsible_name?: string | null;
  hr_responsible_name?: string | null;
  segment?: string | null;
  notes?: string | null;
  lgpd_accepted: boolean;
  lgpd_accepted_at?: string | null;
  created_at: string;
};

export type Job = {
  id: string;
  tenant_id: string;
  company_id: string;
  title: string;
  description: string;
  vacancies: number;
  salary_range?: string | null;
  benefits?: string | null;
  workday?: string | null;
  schedule?: string | null;
  workplace?: string | null;
  modality: string;
  minimum_education?: string | null;
  required_experience?: string | null;
  desired_courses?: string | null;
  cnh_required?: string | null;
  travel_required: boolean;
  contract_type?: string | null;
  notes?: string | null;
  start_date?: string | null;
  closing_deadline?: string | null;
  status: string;
  created_at: string;
};

export type CommunicationThread = {
  id: string;
  company_id: string;
  company_name: string;
  job_id?: string | null;
  job_title?: string | null;
  referral_id?: string | null;
  worker_name?: string | null;
  resume_id?: string | null;
  resume_filename?: string | null;
  topic: string;
  subject: string;
  status: string;
  priority: string;
  last_message_at?: string | null;
  created_at: string;
};

export type CommunicationMessage = {
  id: string;
  thread_id: string;
  sender_user_id?: string | null;
  sender_name?: string | null;
  sender_role: string;
  message_type: string;
  body: string;
  details?: Record<string, unknown> | null;
  created_at: string;
};

export type DataAccessLog = {
  id: string;
  accessed_by_user_id?: string | null;
  accessed_by_name?: string | null;
  worker_id?: string | null;
  worker_name?: string | null;
  resume_id?: string | null;
  resume_filename?: string | null;
  action: string;
  reason?: string | null;
  ip_address?: string | null;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read_at?: string | null;
  created_at: string;
};

export type SineCollaborator = User & {
  is_active: boolean;
  last_login_at?: string | null;
};

export type Resume = {
  id: string;
  tenant_id: string;
  worker_id: string;
  original_filename: string;
  size_bytes: number;
  status: string;
  analysis?: Record<string, unknown> | null;
  created_at: string;
};

export type JobCandidate = {
  worker_id: string;
  worker_name: string;
  worker_email?: string | null;
  worker_phone?: string | null;
  worker_whatsapp?: string | null;
  resume_id?: string | null;
  resume_filename?: string | null;
  application_status: string;
  referral_id?: string | null;
  created_at?: string | null;
  has_lgpd_consent: boolean;
  city?: string | null;
  education?: string | null;
  desired_role?: string | null;
  ai_summary?: string | null;
  match_score?: number | null;
  match_explanation?: string | null;
};

export type CandidateAnalysis = {
  worker_id: string;
  resume_id?: string | null;
  worker_name: string;
  match_score: number;
  match_level: "alta" | "media" | "baixa";
  summary: string;
  skills: string[];
  strengths: string[];
  gaps: string[];
  match_explanation: string;
  suggested_interview_questions: string[];
};

export type CandidateResumeDetail = {
  worker: Record<string, unknown>;
  resume?: Resume | null;
  extracted_text?: string | null;
  applications: Array<Record<string, unknown>>;
  referrals: Array<Record<string, unknown>>;
  access_logs: DataAccessLog[];
};
