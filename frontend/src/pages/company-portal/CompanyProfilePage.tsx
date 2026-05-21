import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "../../services/api";
import {
  AppButton,
  AppCard,
  AppInput,
  AppPageHeader,
  AppSelect,
  AppTextarea,
} from "../../components/ui";
import { LgpdNotice } from "../../components/lgpd/LgpdNotice";
import { asCompanyForm, emptyCompany, regionalCities } from "./constants";
import { PortalAlert } from "./PortalAlert";
import { useCompanyPortal } from "./useCompanyPortal";
import type { Company, CompanyForm } from "./types";

export function CompanyProfilePage() {
  const { company, error, refresh, setError } = useCompanyPortal();
  const [form, setForm] = useState<CompanyForm>(emptyCompany);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(asCompanyForm(company));
  }, [company]);

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.put<Company>("/company-portal/profile", form);
      setMessage(
        "Cadastro da empresa salvo e disponibilizado para a equipe do SINE.",
      );
      refresh();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ??
          "Revise os dados obrigatórios da empresa.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <AppPageHeader
        title="Cadastro da empresa"
        description="Dados oficiais, contatos, região atendida e consentimento LGPD."
      />
      <LgpdNotice compact />
      <PortalAlert message={message} error={error} />
      <AppCard>
        <form onSubmit={saveCompany}>
          <div className="grid gap-3 md:grid-cols-2">
            <AppInput required label="Razão social" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
            <AppInput label="Nome fantasia" value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} />
            <AppInput required label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            <AppInput label="Inscrição estadual" value={form.state_registration} onChange={(e) => setForm({ ...form, state_registration: e.target.value })} />
            <AppInput label="Inscrição federal" value={form.federal_registration} onChange={(e) => setForm({ ...form, federal_registration: e.target.value })} />
            <AppInput label="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
            <AppSelect label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              {regionalCities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </AppSelect>
            <AppInput label="Estado" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} maxLength={2} />
            <AppInput label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <AppInput label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <AppInput label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <AppInput required label="Responsável pelo RH" value={form.hr_responsible_name} onChange={(e) => setForm({ ...form, hr_responsible_name: e.target.value, responsible_name: e.target.value })} />
          </div>
          <AppTextarea label="Observações institucionais" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-3" />
          <label className="mt-4 flex items-start gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-950">
            <input
              required
              type="checkbox"
              checked={form.lgpd_accepted}
              onChange={(e) =>
                setForm({ ...form, lgpd_accepted: e.target.checked })
              }
              className="mt-1"
            />
            <span>
              Declaro ciência e aceite dos termos da LGPD para tratamento dos
              dados da empresa, contatos e histórico de vagas pelo SINE
              Jacarezinho.
            </span>
          </label>
          <AppButton
            type="submit"
            disabled={saving}
            className="mt-4"
            icon={<ShieldCheck size={17} />}
          >
            {saving ? "Salvando..." : "Salvar cadastro"}
          </AppButton>
        </form>
      </AppCard>
    </div>
  );
}
