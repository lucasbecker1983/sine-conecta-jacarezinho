import { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { Company, CompanyReferral, Job, PortalStatus } from "./types";

export function useCompanyPortal() {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [referrals, setReferrals] = useState<CompanyReferral[]>([]);
  const [status, setStatus] = useState<PortalStatus>({
    profile_complete: false,
    pending_returns: 0,
    can_open_job: false,
    ai_scope: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function refresh() {
    setLoading(true);
    Promise.all([
      api.get<Company | null>("/company-portal/profile"),
      api.get<Job[]>("/company-portal/jobs"),
      api.get<CompanyReferral[]>("/company-portal/referrals"),
      api.get<PortalStatus>("/company-portal/status"),
    ])
      .then(([profile, companyJobs, companyReferrals, portalStatus]) => {
        setCompany(profile.data);
        setJobs(companyJobs.data);
        setReferrals(companyReferrals.data);
        setStatus(portalStatus.data);
        setError("");
      })
      .catch(() =>
        setError("Não foi possível carregar a área da empresa agora."),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  return {
    company,
    jobs,
    referrals,
    status,
    loading,
    error,
    refresh,
    setError,
  };
}
