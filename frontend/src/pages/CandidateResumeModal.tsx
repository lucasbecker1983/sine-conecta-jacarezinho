import { useEffect, useState } from "react";
import { FileText, LockKeyhole, X } from "lucide-react";
import { api } from "../services/api";
import type { CandidateResumeDetail, JobCandidate } from "../types";

type Props = {
  jobId: string;
  candidate: JobCandidate | null;
  onClose: () => void;
};

export function CandidateResumeModal({ jobId, candidate, onClose }: Props) {
  const [detail, setDetail] = useState<CandidateResumeDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!candidate) return;
    setDetail(null);
    setError("");
    api
      .get<CandidateResumeDetail>(
        `/jobs/${jobId}/candidates/${candidate.worker_id}/resume`,
      )
      .then(({ data }) => setDetail(data))
      .catch(() =>
        setError("Não foi possível abrir o currículo para triagem."),
      );
  }, [candidate, jobId]);

  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <section className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-md bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {candidate.worker_name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Currículo e histórico para triagem da vaga selecionada.
            </p>
          </div>
          <button
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[calc(88vh-92px)] overflow-auto p-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          {!detail && !error && (
            <div className="text-sm text-slate-500">
              Carregando currículo...
            </div>
          )}
          {detail && (
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <aside className="space-y-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-950">
                    Dados do candidato
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <div>
                      {String(
                        detail.worker.email ??
                          candidate.worker_email ??
                          "E-mail não informado",
                      )}
                    </div>
                    <div>
                      {String(
                        detail.worker.whatsapp ??
                          detail.worker.phone ??
                          candidate.worker_whatsapp ??
                          candidate.worker_phone ??
                          "Telefone não informado",
                      )}
                    </div>
                    <div>
                      {String(
                        detail.worker.city ??
                          candidate.city ??
                          "Cidade não informada",
                      )}
                    </div>
                    <div>
                      {String(
                        detail.worker.education_level ??
                          candidate.education ??
                          "Escolaridade não informada",
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
                  <LockKeyhole size={16} className="mr-1 inline" />A abertura
                  deste currículo gera log LGPD para triagem.
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="text-sm font-bold text-slate-950">
                    Histórico de encaminhamentos
                  </div>
                  <div className="mt-2 space-y-2">
                    {detail.referrals.map((item) => (
                      <div
                        key={String(item.id)}
                        className="rounded-md bg-slate-50 p-2 text-xs text-slate-600"
                      >
                        {String(item.status)} · score{" "}
                        {String(item.match_score ?? "-")}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
              <main className="space-y-4">
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-950">
                    <FileText size={17} className="text-emerald-700" />{" "}
                    {detail.resume?.original_filename ?? "Currículo sem PDF"}
                  </div>
                  <pre className="max-h-96 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                    {detail.extracted_text || "Texto extraído não disponível."}
                  </pre>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="text-sm font-bold text-slate-950">
                    Logs recentes
                  </div>
                  <div className="mt-2 divide-y divide-slate-100">
                    {detail.access_logs.map((log) => (
                      <div key={log.id} className="py-2 text-xs text-slate-600">
                        {log.action} · {log.reason ?? "-"} ·{" "}
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </div>
                    ))}
                  </div>
                </div>
              </main>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
