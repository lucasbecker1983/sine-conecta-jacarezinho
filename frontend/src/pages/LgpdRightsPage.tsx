import { Link } from "react-router-dom";
import { PrivacyNoticeBox } from "../components/lgpd/PrivacyNoticeBox";

export function LgpdRightsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase text-emerald-700">Privacidade e LGPD</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Direitos do titular de dados</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            O SINE Conecta Jacarezinho trata dados para cadastrar candidatos, receber currículos, registrar candidaturas, fazer triagem humana e encaminhar candidatos para empresas quando houver vínculo com uma vaga.
          </p>
        </div>

        <PrivacyNoticeBox variant="triage" />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["Quais dados são tratados", "Dados cadastrais, contato, currículo, experiências, candidaturas, encaminhamentos e registros de auditoria."],
            ["Para que são usados", "Intermediação pública de emprego, comunicação operacional, segurança, auditoria e relatórios gerenciais."],
            ["Quando a empresa recebe dados", "Somente após encaminhamento oficial do SINE para avaliação da vaga correspondente."],
            ["Decisão humana", "A IA interna organiza informações e sugere compatibilidade, mas não decide contratação nem elimina candidatos."],
            ["Como solicitar direitos", "Você pode pedir confirmação de tratamento, acesso, correção, informação sobre compartilhamento, revogação, bloqueio ou anonimização quando cabível."],
            ["Canal do encarregado", "Use o formulário público ou procure o atendimento do SINE Jacarezinho para validação de identidade."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" to="/privacidade/solicitacao">
            Abrir solicitação LGPD
          </Link>
          <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white" to="/vagas">
            Ver vagas abertas
          </Link>
        </div>
      </section>
    </main>
  );
}
