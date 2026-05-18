# LGPD

O sistema registra aceite LGPD do trabalhador com texto, versão, IP, user-agent e data.

Dados sensíveis, como deficiência, não são usados para exclusão automática. O campo existe para atendimento público legítimo, vagas afirmativas e políticas públicas.

Todo acesso a currículo gera registro em `data_access_logs`, incluindo usuário, trabalhador, currículo, ação, finalidade e IP.

Princípios aplicados:

- mínimo acesso por RBAC;
- isolamento por `tenant_id`;
- auditoria para currículo, encaminhamento e dados sensíveis;
- empresa só acessa candidatos formalmente encaminhados.
