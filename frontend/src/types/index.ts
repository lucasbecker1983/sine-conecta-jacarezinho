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
  site?: string | null;
  address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  responsible_name?: string | null;
  responsible_position?: string | null;
  responsible_email?: string | null;
  responsible_phone?: string | null;
  hr_responsible_name?: string | null;
  segment?: string | null;
  company_size?: string | null;
  cnae?: string | null;
  notes?: string | null;
  lgpd_accepted: boolean;
  lgpd_accepted_at?: string | null;
  status?: string;
  profile_complete?: boolean;
  approved_at?: string | null;
  blocked_at?: string | null;
  blocking_reason?: string | null;
  created_at: string;
  updated_at?: string;
};

export type CompanyListItem = Company & {
  open_jobs: number;
  total_jobs: number;
  pending_feedbacks: number;
  referrals_count: number;
  last_activity_at?: string | null;
  blocked: boolean;
};

export type CompanySummary = {
  open_jobs: number;
  closed_jobs: number;
  referrals_received: number;
  pending_feedbacks: number;
  hires_reported: number;
  days_since_last_return?: number | null;
  regularity_status: string;
  blocking_reason?: string | null;
};

export type CompanyJobSummary = {
  id: string;
  title: string;
  status: string;
  is_confidential: boolean;
  vacancies: number;
  created_at: string;
  closing_deadline?: string | null;
  pending_feedbacks: number;
};

export type CompanyReferralSummary = {
  id: string;
  job_id: string;
  job_title: string;
  worker_id: string;
  worker_name: string;
  status: string;
  feedback_status?: string | null;
  created_at: string;
  referred_at?: string | null;
};

export type CompanyFeedbackSummary = {
  id?: string | null;
  referral_id: string;
  job_title: string;
  worker_name: string;
  status: string;
  comments?: string | null;
  pending: boolean;
  created_at?: string | null;
};

export type CompanyAuditSummary = {
  id: string;
  action: string;
  user_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
};

export type CompanyDetail = Company & {
  approved_by_user_id?: string | null;
  blocked_by_user_id?: string | null;
  internal_notes?: string | null;
  summary: CompanySummary;
  jobs: CompanyJobSummary[];
  referrals: CompanyReferralSummary[];
  feedbacks: CompanyFeedbackSummary[];
  audit: CompanyAuditSummary[];
};

export type Worker = {
  id: string;
  tenant_id: string;
  cpf: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  education_level?: string | null;
  desired_role?: string | null;
  availability?: string | null;
  lgpd_accepted: boolean;
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
  is_confidential: boolean;
  contract_type?: string | null;
  notes?: string | null;
  start_date?: string | null;
  closing_deadline?: string | null;
  status: string;
  created_at: string;
  company_name?: string;
  company_legal_name?: string;
  company_trade_name?: string | null;
  company_cnpj?: string;
  company_email?: string | null;
  company_phone?: string | null;
  company_whatsapp?: string | null;
  company_responsible_name?: string | null;
};

export type PublicJob = {
  id: string;
  title: string;
  company_name: string;
  is_confidential: boolean;
  city?: string | null;
  state?: string | null;
  vacancies: number;
  salary_range?: string | null;
  workday?: string | null;
  modality: string;
  minimum_education?: string | null;
  required_experience?: string | null;
  desired_courses?: string | null;
  cnh_required?: string | null;
  description: string;
  benefits?: string | null;
  schedule?: string | null;
  workplace?: string | null;
  created_at: string;
  expires_at?: string | null;
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

export type ResumeBankEntry = {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_cpf_masked?: string | null;
  resume_id?: string | null;
  resume_filename?: string | null;
  status: string;
  entry_reason: string;
  tags: string[];
  desired_roles: string[];
  desired_sectors: string[];
  availability?: string | null;
  city?: string | null;
  education_level?: string | null;
  experience_summary?: string | null;
  ai_summary?: string | null;
  ai_keywords: string[];
  internal_notes?: string | null;
  worker?: Worker;
  resume?: Resume | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
};

export type ResumeBankSuggestion = {
  id: string;
  job_id: string;
  job_title: string;
  resume_bank_entry_id: string;
  worker_id: string;
  worker_name: string;
  resume_id?: string | null;
  resume_filename?: string | null;
  desired_role?: string | null;
  city?: string | null;
  education_level?: string | null;
  professional_summary?: string | null;
  compatibility_score: number;
  compatibility_level: string;
  matched_requirements: string[];
  missing_requirements: string[];
  ai_explanation?: string | null;
  status: string;
  reviewed_at?: string | null;
  created_at: string;
  forwarded_at?: string | null;
};

export type WorkerResumeBankStatus = {
  status?: string | null;
  entered_at?: string | null;
  updated_at?: string | null;
  desired_roles: string[];
  message: string;
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
  source?: string | null;
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
