# Relatório Final - SINE Conecta Jacarezinho

Data: 18/05/2026

## 1. O que foi criado

Foi criada a plataforma SaaS `SINE Conecta Jacarezinho` em `/opt/saas_sine`, com backend FastAPI, frontend React/Vite/TailwindCSS/TypeScript, banco PostgreSQL, estrutura multi-tenant, base white label, autenticação JWT, RBAC, upload/análise de currículos PDF, IA local por regras, auditoria LGPD, Nginx, SSL com Certbot e serviço systemd.

Também foram criados scripts operacionais para gerar `.env`, criar banco, instalar backend, instalar frontend, configurar Nginx/SSL e executar deploy.

## 2. Arquivos principais existentes

- `/opt/saas_sine/.env`
- `/opt/saas_sine/README.md`
- `/opt/saas_sine/backend/app/main.py`
- `/opt/saas_sine/backend/app/core/config.py`
- `/opt/saas_sine/backend/app/core/security.py`
- `/opt/saas_sine/backend/app/core/permissions.py`
- `/opt/saas_sine/backend/app/models/__init__.py`
- `/opt/saas_sine/backend/app/routers/auth.py`
- `/opt/saas_sine/backend/app/routers/crud.py`
- `/opt/saas_sine/backend/app/routers/tenants.py`
- `/opt/saas_sine/backend/app/ai/provider.py`
- `/opt/saas_sine/backend/app/ai/local_provider.py`
- `/opt/saas_sine/backend/app/seed.py`
- `/opt/saas_sine/backend/app/reset_initial_passwords.py`
- `/opt/saas_sine/backend/app/migrations/versions/20260518_0001_initial.py`
- `/opt/saas_sine/frontend/src/main.tsx`
- `/opt/saas_sine/frontend/src/pages/Login.tsx`
- `/opt/saas_sine/frontend/src/pages/Dashboard.tsx`
- `/opt/saas_sine/frontend/src/canvas/CandidateMatchCanvas.tsx`
- `/opt/saas_sine/frontend/src/canvas/ResumeInsightCanvas.tsx`
- `/opt/saas_sine/nginx/sine.jacarezinho.cloud.conf`
- `/etc/nginx/sites-available/sine.jacarezinho.cloud`
- `/etc/nginx/sites-enabled/sine.jacarezinho.cloud`
- `/opt/saas_sine/systemd/saas-sine-backend.service`
- `/etc/systemd/system/saas-sine-backend.service`
- `/opt/saas_sine/docs/LGPD.md`
- `/opt/saas_sine/docs/ARQUITETURA.md`
- `/opt/saas_sine/docs/MULTITENANT.md`
- `/opt/saas_sine/docs/IA_CURRICULOS.md`
- `/opt/saas_sine/docs/DEPLOY.md`

## 3. Porta do backend

O backend está usando a porta local:

```text
127.0.0.1:18743
```

A porta foi gravada em `/opt/saas_sine/.env` como:

```text
BACKEND_PORT=18743
```

## 4. Banco criado

Banco PostgreSQL criado:

```text
saas_sine_db
```

Usuário PostgreSQL criado:

```text
saas_sine_user
```

A senha do banco foi gerada automaticamente e está apenas no `.env`, não hardcoded no código.

## 5. Usuários iniciais criados

Foram criados 2 usuários iniciais:

- `admin@sine.jacarezinho.cloud` com perfil `super_admin`
- `gestor@sine.jacarezinho.cloud` com perfil `tenant_admin`

As senhas foram geradas automaticamente durante o seed e não foram gravadas neste relatório por segurança.

Caso seja necessário gerar novas senhas para esses usuários:

```bash
cd /opt/saas_sine/backend
. .venv/bin/activate
python -m app.reset_initial_passwords
```

Esse comando exibe novas senhas uma única vez no terminal.

## 6. Como acessar o sistema

URL de produção:

```text
https://sine.jacarezinho.cloud
```

Health check da API:

```text
https://sine.jacarezinho.cloud/api/health
```

Login inicial:

- e-mail: `gestor@sine.jacarezinho.cloud`
- senha: gerada pelo seed ou pelo comando de reset acima.

## 7. Como reiniciar o backend

```bash
systemctl restart saas-sine-backend
```

Verificar status:

```bash
systemctl status saas-sine-backend --no-pager
```

## 8. Como ver logs

Logs do systemd:

```bash
journalctl -u saas-sine-backend -f
```

Últimos registros:

```bash
journalctl -u saas-sine-backend -n 100 --no-pager
```

Log de aplicação:

```bash
tail -f /opt/saas_sine/logs/backend.log
```

Logs do Nginx:

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

Logs do Certbot:

```bash
tail -f /var/log/letsencrypt/letsencrypt.log
```

## 9. Como renovar SSL

O Certbot configurou renovação automática.

Teste manual de renovação:

```bash
certbot renew --dry-run
```

Renovação manual:

```bash
certbot renew
systemctl reload nginx
```

Certificado emitido para:

```text
sine.jacarezinho.cloud
```

Validade observada na emissão:

```text
até 16/08/2026
```

## 10. Pontos ainda precisam de melhoria

- Evoluir o frontend de MVP para telas CRUD completas com formulários finais de empresa, trabalhador, vaga, encaminhamento e feedback.
- Criar testes automatizados de backend e frontend.
- Evoluir refresh token para revogação persistente por dispositivo/sessão.
- Adicionar rate limit distribuído em Redis para produção de maior escala.
- Implementar RLS no PostgreSQL ou camada adicional de isolamento por tenant.
- Criar fluxo completo de empresa e trabalhador com autocadastro público.
- Melhorar a extração de texto de PDF com OCR para currículos digitalizados como imagem.
- Adicionar provider real de IA futuramente, mantendo revisão humana obrigatória.
- Implementar exportações formais de relatórios em PDF/CSV.
- Adicionar logs específicos para exportação e visualização por empresa nas telas finais.
- Criar pipeline CI/CD e rotina de backup PostgreSQL.
- Revisar warnings globais existentes no Nginx sobre outros vhosts do servidor, embora `nginx -t` esteja válido.

## Validações executadas

- Frontend buildado com `npm run build`.
- Backend instalado com venv e dependências.
- Alembic migration aplicada.
- Seed inicial executado.
- PostgreSQL conectado e validado com 1 tenant e 2 usuários.
- Serviço `saas-sine-backend` ativo e habilitado.
- `/api/health` validado localmente e via HTTPS.
- Nginx validado com `nginx -t`.
- SSL emitido com Certbot para `sine.jacarezinho.cloud`.
- Diretórios de upload e logs criados.

## 11. Estado atual em 18/05/2026

URL pública:

```text
https://sine.jacarezinho.cloud
```

## Sprint 7 — Qualidade de Produção, Segurança, Testes, Backup e Observabilidade

Data: 20/05/2026

### Arquivos criados

- `backend/tests/` com testes de health, auth, permissões, portal público, candidatura, bloqueio por feedback, triagem SINE, relatórios e LGPD.
- `backend/app/routers/admin.py` com `GET /api/admin/system/status`.
- `backend/app/migrations/versions/20260520_0006_production_indexes.py`.
- `frontend/src/__tests__/` com testes de Login, vagas públicas, dashboard da empresa, triagem e relatórios.
- `frontend/src/components/common/LoadingState.tsx`, `ErrorState.tsx`, `EmptyState.tsx`, `PermissionDenied.tsx`.
- `frontend/src/pages/SystemStatusPage.tsx` e `frontend/src/pages/ReportsPage.tsx`.
- `scripts/backup.sh` e `scripts/restore.sh`.
- `.env.example`, `.github/workflows/ci.yml`, `systemd/logrotate-saas-sine`.
- `docs/BACKUP_RESTORE.md`, `docs/PRODUCAO.md`, `docs/SEGURANCA.md`, `docs/TESTES.md`, `docs/LGPD_CHECKLIST_OPERACIONAL.md`.

### Arquivos alterados

- Backend: configuração, logging, permissões, auth/rate limit, relatórios CSV, roteamento principal, worker apply duplicado e Nginx.
- Frontend: rotas, menu lateral, páginas principais com estados de feedback, package scripts e Vitest.
- Infra: `.gitignore`, `nginx/sine.jacarezinho.cloud.conf`, dependências backend/frontend.

### Hardening aplicado

- CORS sem `*` em produção.
- Validação mínima de força do `JWT_SECRET`.
- Headers seguros no FastAPI e Nginx.
- Logs separados: `backend.log`, `error.log`, `security.log`.
- Rate limit básico de login: 5 tentativas por IP/e-mail em 5 minutos.
- Exportação CSV protegida por `super_admin`, `tenant_admin` e `sine_manager`, com `audit_log`.
- `sine_staff` pode visualizar relatórios internos, mas não exportar.
- Status interno protegido para `super_admin` e `tenant_admin`.
- Backup PostgreSQL + uploads com retenção local de 7 arquivos.

### Testes e cobertura

- Backend: `python -m pytest -q` → 22 passed.
- Cobertura backend: 72% geral.
- Frontend: `npm run test` → 5 arquivos, 10 testes passed.
- Frontend build: `npm run build` concluído com sucesso.

### Validações executadas

- `python -m compileall app` → OK.
- `alembic upgrade head` → OK, migration `20260520_0006` aplicada.
- `nginx -t` → OK; há warnings globais existentes de outros vhosts/protocol options, mas a sintaxe é válida.
- `systemctl restart saas-sine-backend` e `systemctl status saas-sine-backend --no-pager` → serviço ativo.
- `curl http://127.0.0.1:18743/api/health` → 200 OK.
- `curl http://127.0.0.1:18743/api/openapi.json` → 200 OK.
- `GET /api/admin/system/status` com token de admin → 200 OK.
- `bash /opt/saas_sine/scripts/backup.sh` → backup criado em `/opt/saas_sine/backups/sine-conecta-20260520-084605.tar.gz`.
- Permissões validadas via HTTP local:
  - público sem token não acessa relatórios internos: 401.
  - empresa não acessa relatórios/IA: 403.
  - trabalhador não acessa relatórios/triagem: 403.
  - `sine_staff` acessa relatórios e triagem: 200.
  - `sine_staff` não exporta CSV: 403.
  - `tenant_admin` exporta CSV e acessa status do sistema: 200.

### Pendências futuras

- Trocar rate limit em memória por Redis se houver múltiplos workers/processos.
- Evoluir refresh token para revogação persistente por dispositivo.
- Aumentar cobertura dos CRUDs amplos em `crud.py`, `users.py` e fluxos de upload PDF.
- Instalar o modelo de logrotate em `/etc/logrotate.d/saas-sine` durante janela operacional.
- Criar rotina externa/offsite de backup com criptografia e política LGPD formal.

Repositório GitHub:

```text
https://github.com/lucasbecker1983/sine-conecta-jacarezinho
```

## 12. Regra operacional incontestável

A partir deste ponto, toda rodada concluída neste projeto deve terminar com:

- registro do que foi feito em arquivo `.md` do projeto, preferencialmente neste `RELATORIO_FINAL.md` quando for estado funcional/operacional;
- validação objetiva do que foi alterado;
- versionamento no Git;
- commit e push para o GitHub em `origin/main`, salvo bloqueio técnico explícito que deve ser informado no fechamento.

Esta regra vale para mudanças de backend, frontend, banco, infraestrutura, validação, publicação e fluxo de negócio.

## 13. Evolução da área da empresa, comunicação e bloqueio operacional

Foi implementado o módulo completo da empresa no SaaS de recrutamento do SINE Jacarezinho:

- cadastro de empresa com razão social, nome fantasia, CNPJ, inscrições estadual/federal, cidade regional do PR, estado, CEP, contatos, responsável pelo RH e aceite LGPD;
- usuário `company_user` com portal separado;
- empresa mock de validação vinculada a `empresa@sine.jacarezinho.cloud`;
- rotas separadas para `Meu cadastro`, `Minhas vagas`, `Candidatos` e `Comunicação`;
- abertura de vagas com data de início, data final, requisitos detalhados, jornada, local, salário/faixa, escolaridade, CNH, cursos e benefícios;
- Central de Comunicação SINE ↔ empresa, com conversas oficiais auditáveis;
- ligação entre empresa, vaga, encaminhamento, currículo escolhido pelo SINE e feedback da empresa;
- criação automática de conversa oficial quando o SINE encaminha currículo para a empresa;
- feedback da empresa registrado também na conversa oficial;
- Auditoria LGPD para acessos a currículos/candidatos, com usuário, finalidade, IP e data/hora;
- Hero Canvas em React/Tailwind nos dashboards do SINE, empresa e trabalhador.

O fluxo de bloqueio operacional foi endurecido:

1. Quando o SINE encaminha um candidato/currículo para a empresa, a vaga entra em `aguardando_retorno_empresa`.
2. Enquanto houver encaminhamento com retorno pendente, a empresa fica bloqueada para abrir nova vaga.
3. O status `entrevistado` continua pendente.
4. A empresa só é liberada quando registrar feedback final: `contratado`, `dispensado`, `nao_compareceu`, `banco_futuro` ou `sem_interesse`.
5. Ao finalizar o último retorno pendente, a vaga muda para `retorno_registrado`.

Validações executadas nesta evolução:

- `npm run build` no frontend;
- `python -m compileall app` no backend;
- migrações Alembic aplicadas até `20260518_0003`;
- reinício do serviço `saas-sine-backend`;
- validação local de `/api/health`;
- teste HTTP real de conversa SINE ↔ empresa com resposta da empresa;
- teste transacional confirmando bloqueio de nova vaga sem feedback final e liberação após feedback final.

## 14. Amadurecimento dos temas de comunicação e bloqueio de feedback

Foi adicionada uma classificação obrigatória por tema na comunicação SINE ↔ empresa. O objetivo é evitar que toda troca vire uma conversa genérica e permitir triagem operacional, auditoria e cobrança de retorno de forma mais clara.

Temas disponíveis no dropdown:

- `feedback_contratacao`: retorno obrigatório sobre contratação ou não contratação dos candidatos encaminhados;
- `correcao_vaga`: ajuste de cargo, salário, jornada, requisitos, datas ou texto da vaga;
- `agenda_entrevista`: confirmação de comparecimento, alteração de agenda e organização de entrevistas;
- `duvida_perfil_requisitos`: negociação do perfil da vaga, requisitos ou aderência dos candidatos;
- `solicitacao_novos_candidatos`: pedido formal de mais candidatos quando os encaminhados não atenderem;
- `cancelamento_suspensao_vaga`: suspensão, cancelamento ou encerramento do processo seletivo;
- `documentos_lgpd`: documentos, consentimentos, tratamento de dados e registros sensíveis;
- `comunicacao_interna`: comunicação administrativa entre SINE e empresa sem vínculo direto a feedback ou correção.

O bloqueio foi tornado mais explicável:

- `GET /api/company-portal/status` agora retorna `pending_feedbacks` com candidato, vaga, status e encaminhamento que impedem nova vaga;
- retorna também `blocking_reason`;
- a tela da empresa mostra quais encaminhamentos precisam de feedback final;
- a criação de conversa grava o tema em `company_message_threads.topic`;
- foi criada a migração `20260518_0004_company_thread_topics`.

Pesquisa/justificativa funcional usada para os temas:

- O serviço oficial do SINE para empregadores envolve cadastrar vagas, convocar candidatos para entrevista e monitorar encaminhamentos feitos por unidades do SINE.
- O manual operacional do SINE orienta contatar empregador para confirmar comparecimento à entrevista, alterar agenda, solicitar posicionamento e comprovar aceite/colocação quando o processo seletivo se encerra.
- Boas práticas de recrutamento tratam comunicação de status, oferta/contratação, candidatos não selecionados, aprovação/rejeição de vaga e revisão/correção de publicação como fluxos separados.

Validações executadas:

- `python -m compileall app`;
- `alembic upgrade head`, chegando em `20260518_0004`;
- `npm run build`;
- reinício do `saas-sine-backend`;
- `/api/health`;
- criação HTTP real de conversa com tema `correcao_vaga`;
- validação de `GET /api/company-portal/status` retornando `pending_feedbacks` e `blocking_reason`.

## 15. Sino de notificações operacionais

Foi implementado um sino global de notificações no header do sistema, visível para empresa, SINE e demais perfis autenticados.

Eventos que geram notificação:

- mensagem nova do SINE para a empresa;
- resposta da empresa para o SINE;
- abertura de conversa pela empresa;
- feedback de contratação/não contratação registrado pela empresa;
- nova candidatura/interação de trabalhador para o SINE;
- atualização de currículo pelo trabalhador em vaga já relacionada.

Comportamento:

- empresa recebe notificações direcionadas aos usuários vinculados à empresa;
- SINE recebe notificações gerais do tenant quando empresas respondem ou trabalhadores interagem;
- endpoint `GET /api/notifications/summary` retorna contador de não lidas;
- endpoint `GET /api/notifications` retorna as notificações recentes;
- endpoint `POST /api/notifications/read-all` marca como lidas;
- frontend consulta automaticamente a cada 30 segundos e exibe contador no sino.

Validações executadas:

- `python -m compileall app`;
- `npm run build`;
- reinício do `saas-sine-backend`;
- `/api/health`;
- teste HTTP real: mensagem do SINE gerou `{"unread":1}` para empresa;
- teste HTTP real: resposta da empresa gerou `{"unread":1}` para o SINE.

Branch publicado:

```text
main
```

Último commit funcional registrado neste estado:

```text
a63dc52 Require job selection before worker resume submission
```

### Login e perfis

Foram criados usuários temporários para teste dos três perfis públicos/internos:

- Empresa: `empresa@sine.jacarezinho.cloud`
- Candidato: `candidato@sine.jacarezinho.cloud`
- Colaborador: `colaborador@sine.jacarezinho.cloud`

As senhas temporárias foram informadas no terminal/conversa e não devem ser preservadas em arquivo versionado. Para recriar senhas, usar script administrativo ou reset manual com hash bcrypt.

### Credencial do Gestor do SINE

Em 19/05/2026, a senha do usuário gestor do SINE (`gestor@sine.jacarezinho.cloud`) foi redefinida no banco com hash bcrypt e validada por login real na API (`POST /api/auth/login`), retornando o perfil `tenant_admin`.

A senha em texto puro não foi gravada neste relatório nem em qualquer arquivo versionado, por segurança operacional e conformidade LGPD.

### Persistência de Sessão no Dashboard

Em 19/05/2026, foi corrigida a queda indevida para a tela de login durante reload forte do navegador (`Ctrl+Shift+R`) quando ainda existe sessão válida.

Implementação:

- criado endpoint `POST /api/auth/refresh` com validação de refresh token;
- renovação de access token e refresh token na API;
- interceptor Axios renovando a sessão automaticamente em respostas `401`;
- `ProtectedRoute` passou a aceitar sessão pendente com refresh token para permitir revalidação antes de redirecionar;
- backend `saas-sine-backend` reiniciado após a alteração.

Validações executadas:

- `npm run build` no frontend;
- `python -m compileall app` no backend;
- login real do gestor do SINE;
- refresh real via API retornando novo access token e novo refresh token para o perfil `tenant_admin`.

### Rodapé Institucional dos Dashboards

Em 19/05/2026, todos os dashboards protegidos passaram a exibir um rodapé discreto com o texto `Desenvolvido por` e a logo da JMB Tecnologia importada de `/opt/Imagens/JMB_TECNOLOGIA_LOGOTIPO.png`.

A logo foi adicionada aos assets do frontend e dimensionada em tamanho pequeno. O clique abre nova aba para `https://jmbtecnologia.com.br`, conforme solicitado.

Validação executada:

- `npm run build` no frontend.

### UI dos Dashboards com Sidebar e Hero Canvas

Em 19/05/2026, a experiência visual dos dashboards foi amadurecida no layout global protegido.

Alterações:

- usuário logado movido para o rodapé do sidebar, com avatar por iniciais, perfil e ícone de logout;
- header superior ficou mais limpo, mantendo contexto institucional e sino de notificações;
- criado Hero global em React + Tailwind + Canvas para todas as áreas protegidas;
- Hero muda a comunicação conforme o perfil: SINE, empresa ou trabalhador;
- `DashboardHeroCanvas` passou a aceitar classe customizada e animação sutil com linhas de fluxo e pulso visual.

Validação executada:

- `npm run build` no frontend.

### Ajustes de Responsividade do Login

Em 19/05/2026, a tela de login foi compactada para monitores menores, reduzindo scroll indevido no desktop com pouca altura.

Alterações:

- shell do login passou a usar altura controlada no desktop;
- hero e painel de acesso foram compactados em breakpoints de altura;
- cards de perfil, formulário e rodapé reduzem espaçamentos em monitores baixos;
- componente `Logo` passou a usar o asset `sine-logo-fullhd.png`, mantendo qualidade ultra HD no login.

Validação executada:

- `npm run build` no frontend.

### Credencial do Trabalhador

Em 19/05/2026, a senha do usuário trabalhador (`candidato@sine.jacarezinho.cloud`) foi redefinida no banco com hash bcrypt e validada por login real na API (`POST /api/auth/login`), retornando o perfil `worker`.

A senha em texto puro não foi gravada neste relatório nem em qualquer arquivo versionado, por segurança operacional e conformidade LGPD.

### Tela de login

A tela de login foi redesenhada com:

- entrada por perfil: Empresa, Trabalhador e Colaborador;
- Canvas visual institucional;
- logotipo oficial do SINE tratado em PNG com fundo removido;
- rodapé discreto com marca JMB Tecnologia;
- responsividade reforçada para monitores com pouca altura;
- build de produção validado.

### Portal do Trabalhador

O fluxo correto atual é:

1. O trabalhador entra no portal.
2. No dashboard, ele é orientado a escolher uma vaga primeiro.
3. Em `Vagas abertas`, seleciona uma vaga publicada/aberta.
4. O sistema leva para `Meu Currículo` com a vaga selecionada.
5. Com a vaga obrigatoriamente selecionada, o trabalhador escolhe uma das opções:
   - preencher currículo no portal;
   - enviar currículo em PDF.
6. Ao salvar ou enviar PDF, o sistema registra a candidatura vinculada à vaga em `referrals` com status `candidatura_trabalhador`.

Rotas backend envolvidas:

- `GET /api/worker-portal/profile`
- `PUT /api/worker-portal/profile?job_id=...`
- `GET /api/worker-portal/open-jobs`
- `GET /api/worker-portal/resumes`
- `POST /api/worker-portal/resume-pdf` com `job_id` no formulário
- `GET /api/worker-portal/applications`

O envio de PDF:

- exige trabalhador autenticado;
- exige currículo/cadastro salvo;
- exige aceite LGPD;
- exige `job_id`;
- aceita apenas PDF;
- salva em `/opt/saas_sine/uploads/resumes`;
- extrai texto;
- roda análise local;
- registra log LGPD/data access;
- vincula a candidatura à vaga selecionada.

### Portal da Empresa

O login de empresa existe e leva para painel próprio inicial. Ainda precisa evoluir para CRUD completo de solicitação de vaga, responsáveis, candidatos encaminhados e feedback operacional.

### Portal do Colaborador

O colaborador acessa o painel operacional com módulos administrativos iniciais:

- empresas;
- trabalhadores;
- currículos;
- vagas;
- encaminhamentos;
- relatórios;
- white label conforme permissões.

### Estado operacional

- Backend rodando via `saas-sine-backend`.
- Nginx servindo frontend buildado e proxy `/api`.
- SSL ativo com Certbot.
- PostgreSQL usando banco `saas_sine_db`.
- `.env`, uploads, logs, venv, `node_modules` e `dist` estão fora do Git por `.gitignore`.

### Próximos pontos prioritários

- Criar formulário completo de criação/publicação de vagas pelo colaborador e/ou empresa.
- Criar tela administrativa para aprovar vagas e mudar status para `publicada`.
- Exibir candidatos inscritos por vaga no painel do colaborador.
- Implementar visualização detalhada do currículo enviado em PDF com log de acesso.
- Criar fluxo completo da empresa para ver apenas candidatos vinculados às suas vagas.
- Criar testes automatizados para o fluxo trabalhador -> vaga -> currículo -> candidatura.

## 16. Endurecimento de Roles e isolamento por perfil

Em 19/05/2026, o controle de acesso por perfil foi endurecido para impedir navegação cruzada entre áreas de Empresa, Trabalhador e SINE.

Regras implementadas:

- `company_user` representa o papel Empresa e acessa apenas o Portal da Empresa;
- `worker` representa o papel Trabalhador e acessa apenas o Portal do Trabalhador;
- `tenant_admin`, `sine_manager` e `sine_staff` acessam apenas as áreas internas do SINE conforme permissões;
- `super_admin` permanece como perfil master;
- usuário de portal com role Empresa ou Trabalhador não pode acessar permissões internas como empresas, trabalhadores, currículos, vagas, encaminhamentos, relatórios ou auditoria;
- usuário Empresa não pode acessar área de Trabalhador nem área interna do SINE;
- usuário Trabalhador não pode acessar área de Empresa nem área interna do SINE;
- criação/vínculo de usuário de empresa via SINE agora exige e-mail exclusivo de portal e rejeita e-mail que já tenha perfil SINE, Trabalhador ou Master;
- a rota genérica de feedback passou a exigir perfil interno de encaminhamento, enquanto feedback da empresa continua pelo endpoint próprio `/company-portal/referrals/{referral_id}/feedback`;
- o frontend passou a proteger cada rota por role, além de esconder itens de menu não permitidos.

Validações executadas:

- `.venv/bin/python -m compileall app`;
- `npm run build`;
- reinício do serviço `saas-sine-backend`;
- token real de `empresa@sine.jacarezinho.cloud`: `/api/companies` retornou `403`, `/api/company-portal/status` retornou `200`, `/api/worker-portal/open-jobs` retornou `403`;
- token real de `candidato@sine.jacarezinho.cloud`: `/api/companies` retornou `403`, `/api/company-portal/status` retornou `403`, `/api/worker-portal/open-jobs` retornou `200`;
- token real de `colaborador@sine.jacarezinho.cloud`: `/api/companies` retornou `200`, `/api/company-portal/status` retornou `403`, `/api/worker-portal/open-jobs` retornou `403`;
- tentativa de vincular `colaborador@sine.jacarezinho.cloud` como usuário de empresa retornou `409`, preservando o isolamento do perfil.

## 17. Migração de senhas para Argon2id

Em 19/05/2026, o armazenamento de senhas foi migrado de bcrypt para Argon2id, mantendo compatibilidade com hashes antigos.

Implementação:

- `hash_password` agora gera hashes `$argon2id$`;
- `verify_and_upgrade_password` valida senha atual e retorna novo hash quando o algoritmo antigo precisa ser atualizado;
- bcrypt foi mantido apenas como legado para login de usuários já existentes;
- no login real, quando a senha bcrypt valida corretamente, o hash é regravado automaticamente em Argon2id;
- novas senhas geradas por seed, reset administrativo ou usuário de empresa já usam Argon2id;
- foi adicionada a dependência `argon2-cffi==23.1.0`.

Parâmetros Argon2id configurados:

- memória: `19456 KiB`;
- iterações: `2`;
- paralelismo: `1`;
- tipo: `ID`.

Validações executadas:

- teste local confirmou que hash novo inicia com `$argon2id$`;
- teste local confirmou que bcrypt legado valida e retorna hash atualizado para Argon2id;
- `.venv/bin/python -m compileall app`;
- `npm run build`;
- reinício do serviço `saas-sine-backend`;
- `/api/health` local e HTTPS retornaram `{"status":"ok","app":"SINE Conecta Jacarezinho"}`;
- criado usuário temporário com bcrypt legado, login real em `/api/auth/login` retornou `200`, o banco regravou o hash como `$argon2id$` e o usuário temporário foi removido.

## 18. Sprint de experiência operacional, perfil, colaboradores e organização de routers

Em 19/05/2026, foi executada uma sprint focada em transformar o MVP técnico em uma plataforma mais operacional, clara e útil para empresas, trabalhadores e colaboradores do SINE.

Backend:

- `main.py` deixou de incluir o router monolítico `crud.router` diretamente;
- foram criados routers específicos preservando as rotas existentes:
  - `company_portal.py`;
  - `worker_portal.py`;
  - `sine_dashboard.py`;
  - `jobs.py`;
  - `referrals.py`;
  - `feedbacks.py`;
  - `communications.py`;
  - `resumes.py`;
  - `ai_analysis.py`;
  - `users.py`;
  - `profile.py`;
- as rotas antigas `/api/companies`, `/api/workers`, `/api/company-portal/*`, `/api/worker-portal/*`, `/api/communication/*`, `/api/resumes/*`, `/api/referrals`, `/api/feedback`, `/api/reports/summary`, `/api/audit/data-access` e `/api/ai/match/*` foram mantidas;
- foi criada rota `PATCH /api/jobs/{job_id}/status` para aprovar, publicar, pedir correção, cancelar ou encerrar vaga;
- foram criadas rotas de perfil:
  - `GET /api/profile/me`;
  - `PATCH /api/profile/me`;
  - `POST /api/profile/change-password`;
- alteração de senha exige senha atual, nova senha forte e confirmação;
- alteração de senha registra auditoria em `audit_logs`;
- como os refresh tokens atuais são stateless, a alteração registra a necessidade de renovação de sessão e a invalidação persistente por sessão fica como evolução futura;
- foram criadas rotas de colaboradores do SINE:
  - `GET /api/users/sine-collaborators`;
  - `POST /api/users/sine-collaborators`;
  - `PATCH /api/users/sine-collaborators/{user_id}`;
  - `POST /api/users/sine-collaborators/{user_id}/reset-password`;
- perfis permitidos para colaboradores: `sine_staff`, `sine_manager`, `tenant_admin`;
- empresa e trabalhador continuam proibidos de criar colaboradores do SINE.

Frontend:

- criado `favicon.ico` com o logotipo do SINE e linkado em `frontend/index.html`;
- criado menu de perfil no canto superior direito com:
  - Meu perfil;
  - Alterar senha;
  - Dados da conta;
  - Sair;
- criada tela `Perfil` com atualização de nome e alteração de senha;
- criada tela `Colaboradores` para `tenant_admin` e `sine_manager`;
- adicionada navegação de colaboradores no menu interno do SINE;
- dashboard da empresa recebeu mensagem institucional: `Bem-vindo ao SINE Conecta Jacarezinho`;
- dashboard da empresa passou a explicar a parceria entre empresa e SINE, reforçando que a IA é ferramenta interna do SINE;
- bloqueio de nova vaga por feedback pendente passou a usar texto amigável:
  - `Para mantermos o fluxo justo com os trabalhadores e eficiente para sua empresa, precisamos do retorno sobre os candidatos já encaminhados antes de abrir uma nova solicitação.`;
- dashboard do SINE passou a exibir cards operacionais para solicitações, aprovações, currículos, triagem, encaminhamentos, empresas bloqueadas, comunicação e tarefas;
- adicionada seção `Assistente IA do SINE`, deixando explícito que a IA é apoio à triagem e a decisão final é do colaborador.

Validações executadas:

- `.venv/bin/python -m compileall app`;
- `npm run build`;
- reinício do serviço `saas-sine-backend`;
- `/api/health` local retornou `{"status":"ok","app":"SINE Conecta Jacarezinho"}`;
- `/api/openapi.json` retornou `200`;
- `POST /api/profile/change-password` com senha atual incorreta retornou `403`;
- validação por token real:
  - empresa: perfil `200`, companies `403`, company portal `200`, worker portal `403`, colaboradores `403`;
  - trabalhador: perfil `200`, companies `403`, company portal `403`, worker portal `200`, colaboradores `403`;
  - colaborador SINE: perfil `200`, companies `200`, company portal `403`, worker portal `403`, colaboradores `403`;
  - gestor SINE: perfil `200`, companies `200`, company portal `403`, worker portal `403`, colaboradores `200`.

## 19. Refatoração, perfil de usuário, colaboradores do SINE e amadurecimento dos dashboards

Em 19/05/2026, foi executada nova sprint de organização e continuidade, partindo do estado local e do `origin/main` do GitHub, sem recriar o projeto do zero.

Arquivos criados:

- `backend/app/routers/companies.py`;
- `backend/app/routers/workers.py`;
- `backend/app/routers/notifications.py`;
- `backend/app/routers/reports.py`;
- `frontend/src/pages/ChangePasswordPage.tsx`.

Arquivos alterados:

- `backend/app/main.py`;
- `backend/app/routers/crud.py`;
- `backend/app/routers/users.py`;
- `backend/app/schemas/common.py`;
- `frontend/src/layouts/AppLayout.tsx`;
- `frontend/src/main.tsx`;
- `frontend/src/pages/CollaboratorsPage.tsx`;
- `frontend/src/pages/CommunicationPage.tsx`;
- `frontend/src/pages/CompanyDashboard.tsx`;
- `frontend/src/pages/Dashboard.tsx`;
- `frontend/src/pages/ProfilePage.tsx`;
- `frontend/src/pages/WorkerJobsPage.tsx`;
- `frontend/src/types/index.ts`.

Novas rotas e compatibilidade:

- `GET /api/sine-users`;
- `POST /api/sine-users`;
- `PATCH /api/sine-users/{id}`;
- `POST /api/sine-users/{id}/reset-password`;
- `POST /api/sine-users/{id}/activate`;
- `POST /api/sine-users/{id}/deactivate`;
- mantida compatibilidade com `/api/users/sine-collaborators`;
- `GET /api/communication/threads` agora aceita filtros por `topic`, `company_id`, `job_id` e `status`;
- rotas de empresas, trabalhadores, notificações e relatórios foram movidas para routers próprios;
- `crud.py` permanece temporariamente como camada legada/serviços compartilhados para preservar compatibilidade, mas não é mais registrado diretamente no `main.py`.

Frontend e experiência:

- `ProfilePage.tsx` ficou focada nos dados da conta;
- `ChangePasswordPage.tsx` foi criada como tela própria de alteração de senha;
- menu do usuário aponta separadamente para perfil, alteração de senha, dados da conta e sair;
- página de colaboradores passou a usar `/api/sine-users`, editar e-mail/nome/perfil, ativar/desativar por endpoint dedicado e redefinir senha temporária;
- comunicação SINE ↔ empresa ganhou filtros por tema, empresa, vaga e status;
- dashboard do SINE ganhou `Fila de Trabalho do SINE` com prioridades e ações;
- área `Assistente IA do SINE` ganhou seleção de vaga e reforço da frase obrigatória: `A IA é apenas apoio à triagem. A decisão final é do colaborador do SINE.`;
- dashboard do trabalhador ganhou orientação em passos: escolher vaga, preencher/enviar currículo, acompanhar candidatura e aguardar orientação do SINE;
- dashboard da empresa preservou regra de que a IA é interna do SINE e a empresa vê apenas candidatos oficialmente encaminhados.

Formatação:

- Prettier executado nos arquivos frontend alterados;
- Black executado nos arquivos Python alterados;
- imports e quebras de linha foram reorganizados para leitura mais fácil.

Validações executadas:

- `npm run build`;
- `.venv/bin/python -m compileall app`;
- `systemctl restart saas-sine-backend`;
- `systemctl status saas-sine-backend --no-pager`;
- `curl http://127.0.0.1:18743/api/health` retornou `{"status":"ok","app":"SINE Conecta Jacarezinho"}`;
- `/api/openapi.json` retornou `200`;
- `GET /api/sine-users` retornou `200` para gestor e `403` para empresa, trabalhador e colaborador comum;
- rota legada `/api/users/sine-collaborators` retornou `200` para gestor;
- `GET /api/communication/threads?topic=feedback_contratacao&status=aberta` retornou `200`;
- `POST /api/profile/change-password` com senha atual incorreta retornou `403`;
- validação por token real confirmou isolamento:
  - empresa: perfil `200`, companies `403`, company portal `200`, worker portal `403`, sine-users `403`;
  - trabalhador: perfil `200`, companies `403`, company portal `403`, worker portal `200`, sine-users `403`;
  - colaborador SINE: perfil `200`, companies `200`, company portal `403`, worker portal `403`, sine-users `403`;
  - gestor SINE: perfil `200`, companies `200`, company portal `403`, worker portal `403`, sine-users `200`.

O que ainda falta:

- retirar gradualmente as funções de negócio restantes de `crud.py` para serviços/routers definitivos;
- implementar persistência real de invalidação de refresh tokens por sessão/dispositivo;
- criar telas completas de aprovação/correção de vaga e triagem por vaga;
- conectar o Assistente IA a uma lista real de candidatos/currículos por vaga com ações guiadas;
- criar testes automatizados para fluxo empresa -> vaga -> SINE -> encaminhamento -> feedback.

## 20. Sprint 4 — Triagem por Vaga com IA interna do SINE

Em 19/05/2026, foi criada a triagem real por vaga para uso exclusivo dos colaboradores do SINE, mantendo a IA fora do portal da empresa e preservando a regra de que a empresa só visualiza candidatos oficialmente encaminhados.

Arquivos criados:

- `backend/app/services/job_triage_service.py`;
- `backend/app/services/matching_service.py`;
- `backend/app/services/referral_service.py`;
- `backend/app/migrations/versions/20260519_0005_referral_triage_ai_fields.py`;
- `frontend/src/pages/SineJobTriagePage.tsx`;
- `frontend/src/pages/CandidateResumeModal.tsx`;
- `frontend/src/canvas/JobTriageCanvas.tsx`.

Arquivos alterados:

- `backend/app/models/__init__.py`;
- `backend/app/routers/jobs.py`;
- `backend/app/routers/ai_analysis.py`;
- `backend/app/schemas/common.py`;
- `frontend/src/main.tsx`;
- `frontend/src/layouts/AppLayout.tsx`;
- `frontend/src/pages/Dashboard.tsx`;
- `frontend/src/types/index.ts`.

Rotas criadas:

- `GET /api/jobs/{job_id}/candidates`;
- `GET /api/jobs/{job_id}/candidates/{worker_id}/resume`;
- `POST /api/ai/jobs/{job_id}/analyze-candidates`;
- `POST /api/jobs/{job_id}/refer-candidates`;
- frontend protegido em `/sine/triagem` e `/sine/triagem/:jobId`.

Banco e migração:

- adicionados em `referrals`: `match_explanation`, `feedback_status`, `referred_at`, `triage_notes`, `ai_analysis_json` e `last_ai_analyzed_at`;
- migração `20260519_0005` aplicada com `alembic upgrade head`.

Experiência implementada:

- menu interno do SINE ganhou `Triagem por Vaga`;
- dashboard do SINE passou a direcionar novas vagas, candidatos pendentes e o Assistente IA para `/sine/triagem`;
- tela de triagem permite selecionar vaga, revisar requisitos, aprovar/publicar/pedir correção/cancelar, analisar candidatos com IA, filtrar por compatibilidade e encaminhar selecionados;
- Canvas de matching mostra a vaga no centro, candidatos ao redor e intensidade visual conforme `match_score`;
- modal de currículo registra acesso sensível e exibe dados do trabalhador, currículo, texto extraído, histórico e logs básicos;
- pedido de correção de vaga cria conversa com a empresa no tópico `correcao_vaga`;
- encaminhamento cria/atualiza `referrals`, conversa `feedback_contratacao`, notificação para a empresa, audit log e bloqueio por feedback pendente.

Validações executadas:

- `. .venv/bin/activate && python -m compileall app`;
- `. .venv/bin/activate && alembic upgrade head`;
- `npm run build`;
- `systemctl restart saas-sine-backend`;
- `systemctl status saas-sine-backend --no-pager` confirmou serviço `active (running)`;
- `curl http://127.0.0.1:18743/api/health` retornou `200` com `{"status":"ok","app":"SINE Conecta Jacarezinho"}`;
- `curl http://127.0.0.1:18743/api/openapi.json` retornou `200`.

Testes de permissão em `/api/jobs/{job_id}/candidates`:

- empresa: `403`;
- trabalhador: `403`;
- colaborador SINE: `200`;
- gestor SINE: `200`.

Teste de fluxo executado:

- empresa `empresa@sine.jacarezinho.cloud` criou a vaga `Operador de Máquina Sprint 4`;
- SINE publicou a vaga;
- trabalhador `candidato@sine.jacarezinho.cloud` se candidatou;
- SINE executou análise IA da vaga e recebeu score `86`, nível `alta`;
- SINE encaminhou o candidato oficialmente;
- empresa recebeu notificação e visualizou o encaminhamento;
- portal da empresa ficou bloqueado para nova vaga enquanto havia feedback pendente (`pending_returns=1`, `can_open_job=false`);
- tentativa de nova vaga durante o bloqueio retornou `409`;
- empresa registrou feedback final `nao_contratado`;
- bloqueio foi liberado (`pending_returns=0`, `can_open_job=true`).

O que ainda falta:

- trocar o motor heurístico/local por provedor de IA mais robusto quando houver chave operacional configurada;
- criar testes automatizados para o fluxo completo de triagem e feedback;
- evoluir a comparação visual para sugerir candidatos compatíveis do banco geral quando essa regra de produto for liberada.

## 21. Sprint 5 — Portal Público de Vagas e Jornada do Trabalhador

Em 19/05/2026, foi criada a jornada pública de vagas e candidatura do trabalhador, conectando o Portal Público de Vagas à Triagem por Vaga da Sprint 4 sem expor IA, ranking interno ou candidatos não encaminhados para empresas.

Arquivos criados:

- `backend/app/routers/public.py`;
- `frontend/src/pages/PublicJobsPage.tsx`;
- `frontend/src/pages/PublicJobDetailsPage.tsx`;
- `frontend/src/pages/WorkerRegisterPage.tsx`;
- `frontend/src/canvas/PublicJobsCanvas.tsx`.

Arquivos alterados:

- `backend/app/main.py`;
- `backend/app/routers/crud.py`;
- `backend/app/routers/worker_portal.py`;
- `backend/app/schemas/common.py`;
- `backend/app/services/job_triage_service.py`;
- `frontend/src/main.tsx`;
- `frontend/src/layouts/AppLayout.tsx`;
- `frontend/src/pages/Login.tsx`;
- `frontend/src/pages/Dashboard.tsx`;
- `frontend/src/pages/WorkerResumePage.tsx`;
- `frontend/src/pages/SineJobTriagePage.tsx`;
- `frontend/src/types/index.ts`.

Rotas públicas criadas:

- `GET /api/public/jobs`;
- `GET /api/public/jobs/{job_id}`;
- `POST /api/public/workers/register`;
- frontend público em `/vagas`;
- frontend público em `/vagas/:jobId`;
- frontend público em `/trabalhador/cadastro`.

Rotas de candidatura:

- adicionada `POST /api/worker-portal/jobs/{job_id}/apply` com `resume_id` e `confirm_lgpd`;
- mantida compatibilidade com `POST /api/worker-portal/apply/{job_id}`;
- candidatura pública gera/atualiza `referrals.status = candidatura_trabalhador`;
- candidaturas diretas aparecem na triagem com badge `Candidatura direta`.

Segurança e LGPD:

- `/api/public/jobs` expõe apenas vagas com status `publicada`, `em_triagem` e `encaminhando_candidatos`;
- vagas `solicitada`, `em_analise`, `correcao_solicitada`, `cancelada`, `encerrada` e `aguardando_retorno_empresa` não aparecem no portal público;
- dados sensíveis da empresa e contatos diretos não são expostos no endpoint público;
- cadastro público do trabalhador cria usuário `worker`, hash Argon2id, perfil vinculado, `worker`, aceite em `lgpd_consents` e audit log;
- empresa não visualiza candidaturas diretas antes do encaminhamento oficial do SINE;
- a listagem do portal da empresa passou a filtrar apenas encaminhamentos oficiais e status finais.

Experiência implementada:

- portal público com header, logo SINE, botões `Entrar`, `Sou empresa` e `Sou trabalhador`;
- hero com Canvas conectando SINE, trabalhadores, empresas, vagas e atendimento;
- listagem com filtros por palavra-chave, cidade, cargo, modalidade, escolaridade, salário informado e ordenação por recentes/encerramento;
- página de detalhe da vaga com salário, jornada, modalidade, escolaridade, experiência, cursos, CNH, benefícios, prazo e orientação LGPD;
- cadastro simples do trabalhador com campos obrigatórios, senha forte e aceite LGPD;
- login ganhou links para `Ver vagas abertas`, cadastro de trabalhador e acesso da empresa;
- dashboard do trabalhador passou a mostrar vagas abertas, candidaturas, currículos, dados faltantes e orientação de que a empresa só vê dados após encaminhamento oficial;
- tela `WorkerResumePage` ganhou etapa explícita `Confirmar candidatura` usando a nova rota;
- dashboard do SINE preservou o CTA para `/sine/triagem`.

Validações executadas:

- `. .venv/bin/activate && python -m compileall app`;
- `. .venv/bin/activate && alembic upgrade head`;
- `npm run build`;
- `systemctl restart saas-sine-backend`;
- `systemctl status saas-sine-backend --no-pager` confirmou `active (running)`;
- `curl http://127.0.0.1:18743/api/health` retornou `200` com `{"status":"ok","app":"SINE Conecta Jacarezinho"}`;
- `curl http://127.0.0.1:18743/api/openapi.json` retornou `200`;
- `https://sine.jacarezinho.cloud/vagas` retornou `200`;
- `https://sine.jacarezinho.cloud/vagas/{job_id}` retornou `200`;
- `https://sine.jacarezinho.cloud/trabalhador/cadastro?jobId=...` retornou `200`.

Teste de fluxo público:

- empresa criou a vaga `Auxiliar Administrativo Portal Público Sprint 5`;
- SINE publicou a vaga;
- `GET /api/public/jobs` retornou a vaga publicada;
- `GET /api/public/jobs/{job_id}` retornou o detalhe da vaga;
- trabalhador público foi cadastrado com aceite LGPD e `job_id` preservado;
- currículo PDF foi enviado;
- candidatura foi confirmada em `POST /api/worker-portal/jobs/{job_id}/apply`;
- antes do encaminhamento, `GET /api/company-portal/referrals` não mostrou a candidatura para a empresa;
- `GET /api/jobs/{job_id}/candidates` mostrou a candidatura na triagem com `source=public_portal`;
- análise IA interna do SINE retornou 1 candidato com score `100`;
- SINE encaminhou oficialmente o candidato;
- após encaminhamento, a empresa visualizou o candidato em `company-portal/referrals`;
- feedback final de teste foi registrado para liberar a empresa (`pending_returns=0`, `can_open_job=true`);
- uma vaga `Atendente de Loja Portal Público` ficou publicada para validação contínua do portal público.

Testes de segurança:

- empresa tentando acessar `/api/jobs/{job_id}/candidates`: `403`;
- trabalhador tentando acessar `/api/jobs/{job_id}/candidates`: `403`;
- público sem token tentando acessar `/api/jobs/{job_id}/candidates`: `401`;
- público sem token tentando acessar `/api/ai/jobs/{job_id}/analyze-candidates`: `401`;
- empresa tentando acessar IA interna: `403`;
- público acessou somente `/api/public/jobs` e `/api/public/jobs/{job_id}`.

O que ainda falta:

- criar teste automatizado end-to-end para portal público, cadastro, currículo, candidatura e triagem;
- criar página pública institucional da empresa apenas se houver regra futura de anonimização/visibilidade;
- evoluir recomendações do trabalhador sem expor ranking ou critérios internos de IA.

## Sprint 8 — Módulo LGPD Avançado

Objetivo concluído: criado módulo avançado de governança LGPD integrado ao SaaS existente, sem recriar o projeto e preservando login, dashboards, portal público, jornada do trabalhador, dashboard da empresa, triagem, IA interna, relatórios, comunicação e bloqueio por feedback pendente.

Tabelas e migrations criadas:

- `20260520_0007_lgpd_advanced.py`;
- `20260520_0008_lgpd_deleted_at_alignment.py`;
- `lgpd_terms_versions`;
- `lgpd_data_subject_requests`;
- `lgpd_request_events`;
- `lgpd_consent_history`;
- `lgpd_data_sharing_records`;
- `lgpd_retention_policies`;
- `lgpd_retention_reviews`;
- `lgpd_incidents`;
- `lgpd_processing_activities`;
- novos campos em `workers`: `is_anonymized`, `anonymized_at`, `processing_blocked`, `processing_blocked_at`.

Backend criado/alterado:

- `backend/app/routers/lgpd.py`;
- `backend/app/services/lgpd_service.py`;
- `backend/app/services/data_retention_service.py`;
- `backend/app/services/anonymization_service.py`;
- `backend/app/services/incident_service.py`;
- `backend/app/models/__init__.py`;
- `backend/app/schemas/common.py`;
- `backend/app/services/referral_service.py`;
- `backend/app/main.py`;
- `backend/pytest.ini`.

Endpoints principais:

- públicos: `GET /api/lgpd/public/terms`, `POST /api/lgpd/public/requests`;
- trabalhador: `GET /api/lgpd/me/consents`, `GET /api/lgpd/me/data-sharing`, `GET/POST /api/lgpd/me/requests`, `POST /api/lgpd/me/consents/{consent_id}/revoke`;
- empresa: `GET /api/lgpd/company/consents`, `GET /api/lgpd/company/data-sharing`, `GET/POST /api/lgpd/company/requests`;
- administrativo: termos, solicitações, eventos, exportação, correção, anonimização, bloqueio, retenção, incidentes, atividades de tratamento e compartilhamentos.

Frontend criado/alterado:

- `frontend/src/pages/LgpdRightsPage.tsx`;
- `frontend/src/pages/LgpdRequestPage.tsx`;
- `frontend/src/pages/WorkerPrivacyPage.tsx`;
- `frontend/src/pages/CompanyPrivacyPage.tsx`;
- `frontend/src/pages/LgpdAdminPage.tsx`;
- `frontend/src/components/lgpd/LgpdStatusBadge.tsx`;
- `frontend/src/components/lgpd/LgpdRequestTimeline.tsx`;
- `frontend/src/components/lgpd/ConsentVersionCard.tsx`;
- `frontend/src/components/lgpd/DataSharingTable.tsx`;
- `frontend/src/components/lgpd/RetentionPolicyCard.tsx`;
- `frontend/src/components/lgpd/IncidentSeverityBadge.tsx`;
- `frontend/src/components/lgpd/PrivacyNoticeBox.tsx`;
- rotas adicionadas em `frontend/src/main.tsx`;
- menus adicionados em `frontend/src/layouts/AppLayout.tsx`.

Rotas frontend:

- `/privacidade/direitos`;
- `/privacidade/solicitacao`;
- `/trabalhador/privacidade`;
- `/empresa/privacidade`;
- `/lgpd`.

Testes criados:

- `backend/tests/test_lgpd_advanced.py`;
- `frontend/src/__tests__/LgpdPages.test.tsx`.

Documentação criada/atualizada:

- `docs/LGPD_AVANCADO.md`;
- `docs/LGPD.md`;
- `docs/LGPD_CHECKLIST_OPERACIONAL.md`;
- `docs/SEGURANCA.md`;
- `docs/PRODUCAO.md`;
- `README.md`.

Hardening e auditoria:

- endpoints administrativos LGPD exigem autenticação;
- público acessa apenas termos e criação de solicitação;
- trabalhador e empresa têm rotas próprias segregadas;
- exportação de dados do titular registra `audit_log` e evento `data_exported`;
- correção registra `audit_log` e evento `correction_applied`;
- anonimização registra `audit_log` e evento `anonymization_applied`;
- incidente registra `audit_log`;
- encaminhamento oficial pelo SINE cria `lgpd_data_sharing_records`;
- retenção cria fila de revisão manual, sem exclusão automática.

Validações executadas:

- `cd /opt/saas_sine/backend && . .venv/bin/activate && python -m compileall app`: OK;
- `cd /opt/saas_sine/backend && . .venv/bin/activate && pytest -q`: 31 passed, 43 warnings;
- `cd /opt/saas_sine/backend && . .venv/bin/activate && coverage run -m pytest && coverage report`: 31 passed, cobertura total 71%;
- `cd /opt/saas_sine/backend && . .venv/bin/activate && alembic upgrade head`: OK, head em `20260520_0008`;
- `cd /opt/saas_sine/frontend && npm run test`: 6 arquivos, 17 testes, todos passaram;
- `cd /opt/saas_sine/frontend && npm run build`: OK;
- `systemctl restart saas-sine-backend`: OK;
- `systemctl status saas-sine-backend --no-pager`: `active (running)`;
- `curl http://127.0.0.1:18743/api/health`: 200, `{"status":"ok","app":"SINE Conecta Jacarezinho"}`;
- `curl http://127.0.0.1:18743/api/openapi.json`: 200;
- `nginx -t`: sintaxe OK e teste bem-sucedido, com warnings pré-existentes de vhosts/nomes conflitantes fora do escopo da sprint.

Testes manuais LGPD:

- `/privacidade/direitos`: 200;
- `/privacidade/solicitacao`: 200;
- `GET /api/lgpd/public/terms`: 200;
- solicitação pública LGPD criada: `f162ce2e-4863-4df1-b111-c2ece89624a4`;
- `/trabalhador/privacidade`: 200;
- `GET /api/lgpd/me/consents` com token worker: 200;
- solicitação LGPD pelo trabalhador criada: `1c041ca1-8c09-420a-9e9c-5be02fed0f97`;
- `/empresa/privacidade`: 200;
- `GET /api/lgpd/company/data-sharing` com token empresa: 200;
- `/lgpd`: 200;
- `GET /api/lgpd/dashboard` com token tenant_admin: 200;
- `GET /api/lgpd/requests` com token tenant_admin: 200;
- empresa acessando painel interno `/api/lgpd/requests`: 403;
- trabalhador acessando painel interno `/api/lgpd/requests`: 403;
- alteração de status de solicitação: 200;
- adição de resposta: 200;
- conclusão de solicitação: 200;
- criação de incidente: 201;
- criação de política de retenção: 201;
- execução de revisão de retenção: 200;
- encaminhamento controlado criou `lgpd_data_sharing_records`: 200, `sharing_after_has_sprint8=True`;
- feedback final da empresa registrado após teste de encaminhamento: 200.

Pendências futuras:

- adicionar download temporário assinado para pacote de portabilidade;
- parametrizar prazo LGPD por tenant;
- implementar fluxo de dupla aprovação para descarte definitivo;
- notificar encarregado e titular por e-mail quando SMTP estiver formalizado;
- limpar warnings globais do Nginx em sprint de infraestrutura dedicada.

## Sprint 9 — UX Premium, Polimento Visual e Experiência Humanizada

Objetivo:

- transformar a interface em uma experiência GovTech mais profissional, acolhedora, responsiva e acessível;
- preservar regras de negócio, login, dashboards, portal público, triagem, relatórios e LGPD avançada;
- não alterar regras centrais de backend.

Arquivos e áreas criadas:

- `frontend/src/components/ui/`: design system com botões, cards, badges, alertas, inputs, selects, textarea, modal, abas, tabela, tooltip, stepper, headers, métricas, estados vazios/loading/erro/permissão, títulos, timeline e dicas;
- `frontend/src/components/onboarding/OnboardingChecklist.tsx`;
- `frontend/src/components/onboarding/OnboardingCard.tsx`;
- `frontend/src/white-label/tenantTheme.ts`;
- `frontend/src/white-label/useTenantTheme.ts`;
- `frontend/src/styles/premium.css`;
- `frontend/src/utils/statusLabels.ts`;
- `frontend/src/__tests__/UxPremium.test.tsx`;
- `docs/UX_PREMIUM.md`.

Páginas alteradas:

- `frontend/src/pages/Login.tsx`;
- `frontend/src/pages/PublicJobsPage.tsx`;
- `frontend/src/pages/WorkerRegisterPage.tsx`;
- `frontend/src/pages/Dashboard.tsx`;
- `frontend/src/pages/CompanyDashboard.tsx`;
- `frontend/src/pages/SineJobTriagePage.tsx`;
- `frontend/src/pages/ReportsPage.tsx`;
- `frontend/src/pages/LgpdRequestPage.tsx`;
- `frontend/src/layouts/AppLayout.tsx`;
- `frontend/src/index.css`;
- `README.md`.

Melhorias por perfil:

- trabalhador: hero acolhedor, cards de candidaturas/currículo/vagas/encaminhamentos/privacidade, timeline de candidatura e cadastro em etapas;
- empresa: onboarding, aviso humanizado de feedback pendente, card de privacidade, status amigáveis e reforço de que IA é interna do SINE;
- SINE: painel operacional com fila de trabalho, assistente IA destacado, LGPD na fila e status mais claros;
- público: login premium, portal de vagas com hero, cards de confiança, filtros e estado vazio humanizado;
- LGPD: solicitação pública em etapas e mensagens de sucesso/erro padronizadas.

Melhorias mobile e acessibilidade:

- menu mobile no `AppLayout`;
- foco visível global;
- botões e links com áreas clicáveis melhores;
- filtros e cards responsivos;
- mensagens associadas a estado/ação;
- respeito a `prefers-reduced-motion`;
- Canvas preservado sem virar dependência para leitura.

Testes executados:

- `cd /opt/saas_sine/frontend && npm run test`: 7 arquivos, 19 testes, todos passaram;
- `cd /opt/saas_sine/frontend && npm run build`: OK;
- `cd /opt/saas_sine/backend && . .venv/bin/activate && python -m compileall app`: OK;
- `cd /opt/saas_sine/backend && . .venv/bin/activate && pytest -q`: 31 passed, 43 warnings;
- `cd /opt/saas_sine/backend && . .venv/bin/activate && alembic upgrade head`: OK;
- `systemctl restart saas-sine-backend`: OK;
- `systemctl status saas-sine-backend --no-pager`: `active (running)`;
- `curl http://127.0.0.1:18743/api/health`: 200, `{"status":"ok","app":"SINE Conecta Jacarezinho"}`;
- `curl http://127.0.0.1:18743/api/openapi.json`: 200;
- `nginx -t`: sintaxe OK e teste bem-sucedido, com warnings pré-existentes de vhosts/nomes conflitantes fora do escopo desta sprint.

Validação visual/manual registrada:

- login desktop/mobile: revisado por build e rota `/login` 200;
- portal público `/vagas` desktop/mobile: revisado por build e rota 200;
- detalhe da vaga: SPA fallback `/vagas/job-smoke` 200;
- cadastro do trabalhador: rota `/trabalhador/cadastro` 200;
- dashboard trabalhador: cards/timeline/onboarding revisados no código e testes de build;
- dashboard empresa: bloqueio amigável e aviso IA cobertos por teste;
- dashboard SINE: Fila de Trabalho e Assistente IA revisados no código;
- triagem por vaga: aviso IA, status amigável e aviso de encaminhamento revisados;
- relatórios: título, filtros e exportação por perfil preservados em testes;
- LGPD pública: `/privacidade/direitos` 200 e `/privacidade/solicitacao` 200;
- LGPD admin: SPA `/lgpd` 200, acesso real protegido pelo módulo Sprint 8;
- menu mobile: implementado no `AppLayout`;
- estados vazios/loading/erros: design system criado e aplicado nas telas tocadas;
- acessibilidade básica com Tab: foco visível e labels preservados;
- Canvas: build validado sem quebrar layout.

Pendências futuras:

- executar auditoria Lighthouse/axe com screenshots reais em staging;
- adicionar Playwright para smoke visual desktop/mobile;
- permitir edição do tema white label por tenant no painel;
- converter tabelas longas restantes para cards em mobile;
- expandir uso do design system para telas administrativas secundárias.

### Ajuste pós-Sprint 9 — Direção visual e redução de poluição

Motivação:

- a primeira versão do Hero ficou visualmente carregada, com Canvas, cards, CTAs e gradientes competindo por atenção;
- o layout interno também tinha um Hero global no `AppLayout`, repetido em todas as áreas autenticadas, criando ruído acima das páginas.

Correções aplicadas:

- `frontend/src/pages/Login.tsx`: Hero simplificado, CTAs duplicados removidos, cores mais sóbrias e foco maior no fluxo de autenticação;
- `frontend/src/pages/PublicJobsPage.tsx`: Canvas duplicado removido, filtros organizados com título e contagem, bloco de confiança simplificado;
- `frontend/src/layouts/AppLayout.tsx`: Hero global com Canvas removido das páginas internas para reduzir poluição visual;
- `frontend/src/pages/Dashboard.tsx`: headers do trabalhador e SINE simplificados, sem Canvas decorativo redundante;
- `frontend/src/pages/CompanyDashboard.tsx`: header da empresa simplificado, sem painel visual redundante.

Validações:

- `cd /opt/saas_sine/frontend && npm run test`: 7 arquivos, 19 testes, todos passaram;
- `cd /opt/saas_sine/frontend && npm run build`: OK.

### Ajuste pós-Sprint 9 — Padronização UI/UX nos fluxos principais

Objetivo:

- revisar a UI do frontend sem alterar regras de negócio, endpoints, autenticação, permissões ou fluxos atuais;
- aplicar progressivamente os componentes de `frontend/src/components/ui` nas telas principais do SINE, empresa e trabalhador.

Arquivos refatorados nesta rodada:

- `frontend/src/layouts/AppLayout.tsx`;
- `frontend/src/pages/Dashboard.tsx`;
- `frontend/src/pages/CompanyDashboard.tsx`;
- `frontend/src/pages/WorkerResumePage.tsx`;
- `frontend/src/pages/WorkerJobsPage.tsx`;
- `frontend/src/pages/EntityPage.tsx`;
- `frontend/src/components/ui/AppBadge.tsx`.

Melhorias aplicadas:

- headers migrados para `AppPageHeader` em dashboards e páginas de trabalhador/empresa;
- cards e métricas migrados para `AppCard` e `AppMetricCard`;
- alertas e estados técnicos migrados para `AppAlert`, `AppLoadingState` e `AppErrorState`;
- tabelas genéricas migradas para `AppTable`;
- formulários principais de empresa/trabalhador migrados para `AppInput`, `AppSelect`, `AppTextarea` e `AppButton`;
- stepper do trabalhador migrado para `AppStepper`;
- status técnicos expostos ao usuário passaram a usar `friendlyStatus` quando aplicável;
- foco visível, `aria-expanded` e áreas clicáveis melhoradas no `AppLayout`;
- `AppBadge` passou a suportar ícone + texto com espaçamento consistente.

Validação:

- `cd /opt/saas_sine/frontend && npm run build`: OK.
