import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { EntityPage } from './pages/EntityPage'
import { Login } from './pages/Login'
import { WorkerJobsPage } from './pages/WorkerJobsPage'
import { WorkerResumePage } from './pages/WorkerResumePage'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="empresas" element={<EntityPage title="Empresas" description="Cadastro e gestão das empresas solicitantes." endpoint="/companies" actionLabel="Cadastrar empresa" />} />
            <Route path="trabalhadores" element={<EntityPage title="Trabalhadores" description="Cadastro, LGPD, histórico e busca de candidatos." endpoint="/workers" actionLabel="Cadastrar trabalhador" />} />
            <Route path="meu-curriculo" element={<WorkerResumePage />} />
            <Route path="vagas-abertas" element={<WorkerJobsPage />} />
            <Route path="curriculos" element={<EntityPage title="Currículos" description="Upload, análise local de IA e auditoria de acessos." actionLabel="Enviar PDF" />} />
            <Route path="vagas" element={<EntityPage title="Vagas" description="Solicitações, aprovação, publicação e triagem." endpoint="/jobs" actionLabel="Criar vaga" />} />
            <Route path="encaminhamentos" element={<EntityPage title="Encaminhamentos" description="Candidatos formalmente enviados para empresas." actionLabel="Encaminhar candidato" />} />
            <Route path="relatorios" element={<EntityPage title="Relatórios" description="Indicadores operacionais e gerenciais por tenant." actionLabel="Exportar" />} />
            <Route path="admin" element={<EntityPage title="Configurações white label" description="Logo, cores, textos institucionais e usuários internos." actionLabel="Salvar identidade" />} />
            <Route path="master" element={<EntityPage title="Painel Master SaaS" description="Base para gerir tenants, domínios e uso da plataforma." actionLabel="Novo tenant" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
