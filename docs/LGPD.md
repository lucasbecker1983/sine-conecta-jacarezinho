# LGPD

O sistema registra aceite LGPD do trabalhador com texto, versão, IP, user-agent e data.

Dados sensíveis, como deficiência, não são usados para exclusão automática. O campo existe para atendimento público legítimo, vagas afirmativas e políticas públicas.

Todo acesso a currículo gera registro em `data_access_logs`, incluindo usuário, trabalhador, currículo, ação, finalidade e IP.

Princípios aplicados:

- mínimo acesso por RBAC;
- isolamento por `tenant_id`;
- auditoria para currículo, encaminhamento e dados sensíveis;
- empresa só acessa candidatos formalmente encaminhados.

## Sprint 8

O módulo avançado fica documentado em `docs/LGPD_AVANCADO.md` e adiciona:

- termos versionados em `lgpd_terms_versions`;
- solicitações de titulares em `lgpd_data_subject_requests`;
- eventos em `lgpd_request_events`;
- histórico de consentimento em `lgpd_consent_history`;
- registros de compartilhamento em `lgpd_data_sharing_records`;
- políticas e revisões de retenção;
- incidentes de segurança e privacidade;
- mapa de atividades de tratamento.
