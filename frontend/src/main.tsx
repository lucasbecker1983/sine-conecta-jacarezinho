import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { AuthorizedRoute } from "./components/AuthorizedRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { CompaniesPage } from "./pages/CompaniesPage";
import {
  CompanyJobsPage,
  CompanyProfilePage,
  CompanyReferralsPage,
} from "./pages/CompanyDashboard";
import { AuditLgpdPage, CommunicationPage } from "./pages/CommunicationPage";
import { CollaboratorsPage } from "./pages/CollaboratorsPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { EntityPage } from "./pages/EntityPage";
import { Login } from "./pages/Login";
import { ProfilePage } from "./pages/ProfilePage";
import { WorkerJobsPage } from "./pages/WorkerJobsPage";
import { WorkerResumePage } from "./pages/WorkerResumePage";

const sineRoles = ["super_admin", "tenant_admin", "sine_manager", "sine_staff"];
const companyRoles = ["company_user"];
const workerRoles = ["worker"];

function only(allowedRoles: string[], element: React.ReactElement) {
  return (
    <AuthorizedRoute allowedRoles={allowedRoles}>{element}</AuthorizedRoute>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="alterar-senha" element={<ChangePasswordPage />} />
            <Route
              path="empresas"
              element={only(sineRoles, <CompaniesPage />)}
            />
            <Route
              path="empresa/cadastro"
              element={only(companyRoles, <CompanyProfilePage />)}
            />
            <Route
              path="empresa/vagas"
              element={only(companyRoles, <CompanyJobsPage />)}
            />
            <Route
              path="empresa/encaminhamentos"
              element={only(companyRoles, <CompanyReferralsPage />)}
            />
            <Route
              path="empresa/comunicacao"
              element={only(companyRoles, <CommunicationPage mode="company" />)}
            />
            <Route
              path="trabalhadores"
              element={only(
                sineRoles,
                <EntityPage
                  title="Trabalhadores"
                  description="Cadastro, LGPD, histórico e busca de candidatos."
                  endpoint="/workers"
                  actionLabel="Cadastrar trabalhador"
                />,
              )}
            />
            <Route
              path="meu-curriculo"
              element={only(workerRoles, <WorkerResumePage />)}
            />
            <Route
              path="vagas-abertas"
              element={only(workerRoles, <WorkerJobsPage />)}
            />
            <Route
              path="curriculos"
              element={only(
                sineRoles,
                <EntityPage
                  title="Currículos"
                  description="Upload, análise local de IA e auditoria de acessos."
                  actionLabel="Enviar PDF"
                />,
              )}
            />
            <Route
              path="vagas"
              element={only(
                sineRoles,
                <EntityPage
                  title="Vagas"
                  description="Solicitações, aprovação, publicação e triagem."
                  endpoint="/jobs"
                  actionLabel="Criar vaga"
                />,
              )}
            />
            <Route
              path="encaminhamentos"
              element={only(
                sineRoles,
                <EntityPage
                  title="Encaminhamentos"
                  description="Candidatos formalmente enviados para empresas."
                  actionLabel="Encaminhar candidato"
                />,
              )}
            />
            <Route
              path="comunicacao"
              element={only(sineRoles, <CommunicationPage mode="sine" />)}
            />
            <Route
              path="colaboradores"
              element={only(
                ["super_admin", "tenant_admin", "sine_manager"],
                <CollaboratorsPage />,
              )}
            />
            <Route
              path="auditoria-lgpd"
              element={only(
                ["super_admin", "tenant_admin", "sine_manager"],
                <AuditLgpdPage />,
              )}
            />
            <Route
              path="relatorios"
              element={only(
                ["super_admin", "tenant_admin", "sine_manager"],
                <EntityPage
                  title="Relatórios"
                  description="Indicadores operacionais e gerenciais por tenant."
                  actionLabel="Exportar"
                />,
              )}
            />
            <Route
              path="admin"
              element={only(
                ["super_admin", "tenant_admin"],
                <EntityPage
                  title="Configurações white label"
                  description="Logo, cores, textos institucionais e usuários internos."
                  actionLabel="Salvar identidade"
                />,
              )}
            />
            <Route
              path="master"
              element={only(
                ["super_admin"],
                <EntityPage
                  title="Painel Master SaaS"
                  description="Base para gerir tenants, domínios e uso da plataforma."
                  actionLabel="Novo tenant"
                />,
              )}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
