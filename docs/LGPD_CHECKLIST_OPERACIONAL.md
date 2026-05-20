# Checklist LGPD Operacional

- O aceite LGPD do trabalhador é registrado em `lgpd_consents` e no campo `workers.lgpd_accepted`.
- Empresas registram dados cadastrais, CNPJ, contatos e responsável de RH.
- Trabalhadores registram dados pessoais, contato, formação, experiência e currículo.
- A finalidade é intermediação pública de mão de obra pelo SINE.
- Currículos são acessados pelo SINE para triagem e encaminhamento.
- Empresa recebe dados do trabalhador apenas após encaminhamento oficial.
- Visualização de currículo deve gerar `data_access_log`.
- Exportação de relatórios deve gerar `audit_log`.
- Não enviar currículo ou dados sensíveis por mensagens informais.
- Pedidos futuros de correção/exclusão devem localizar trabalhador, registrar solicitação e executar política pública definida.
- Colaboradores do SINE devem acessar apenas dados necessários para atendimento, triagem e encaminhamento.

## Sprint 8

- Termos versionados ficam em `lgpd_terms_versions`; versões antigas não devem ser apagadas.
- Solicitações de titulares ficam em `lgpd_data_subject_requests` e eventos em `lgpd_request_events`.
- O prazo padrão operacional é 15 dias corridos; solicitações próximas ao vencimento aparecem no painel `/lgpd`.
- Compartilhamento com empresa só ocorre por encaminhamento oficial e deve gerar `lgpd_data_sharing_records`.
- Anonimização exige `tenant_admin` ou `super_admin` e deve registrar `audit_log`.
- `sine_staff` pode apoiar atendimento, mas não aprova anonimização.
- Incidentes de privacidade ficam em `lgpd_incidents` com severidade, contenção e necessidade de notificação.
- Revisão de retenção é manual nesta sprint; nenhuma exclusão automática deve ser feita.
