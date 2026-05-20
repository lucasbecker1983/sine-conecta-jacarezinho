# LGPD Avançado

## Visão geral

A Sprint 8 cria um módulo de governança LGPD integrado ao SINE Conecta Jacarezinho. O módulo controla termos versionados, solicitações dos titulares, histórico de consentimentos, compartilhamentos oficiais com empresas, retenção, anonimização, incidentes e atividades de tratamento.

Tudo respeita `tenant_id`. Trabalhador vê apenas seus próprios dados. Empresa vê apenas dados recebidos por encaminhamento oficial. O SINE acessa a governança conforme perfil.

## Direitos do titular

O titular pode solicitar confirmação de tratamento, acesso, correção, informação sobre compartilhamento, portabilidade, revogação de consentimento, bloqueio, anonimização ou exclusão quando cabível.

Solicitações públicas entram por `/privacidade/solicitacao` e são registradas em `lgpd_data_subject_requests` com prazo padrão de 15 dias.

## Tratamento das solicitações

O painel `/lgpd` permite listar, atribuir, alterar status, adicionar resposta, concluir e consultar eventos da solicitação. Cada alteração relevante grava `lgpd_request_events` e `audit_logs`.

Perfis:

- `sine_staff`: atendimento e leitura operacional.
- `sine_manager`: análise e exportação dos dados do titular.
- `tenant_admin`: aprovação, conclusão, anonimização e auditoria.
- `super_admin`: visão administrativa conforme escopo.

## Consentimentos versionados

Termos ficam em `lgpd_terms_versions`. Ao publicar uma versão ativa, a versão anterior do mesmo `term_type` é desativada, sem apagamento histórico.

O histórico fica em `lgpd_consent_history`, preservando status `accepted`, `revoked` ou `expired`, base legal, finalidade, IP e user agent quando disponíveis.

## Compartilhamento com empresas

Quando o SINE encaminha oficialmente um candidato, o sistema cria `lgpd_data_sharing_records` com trabalhador, empresa, vaga, encaminhamento, categorias de dados, finalidade e base legal.

A empresa não acessa IA interna e não vê candidatos antes do encaminhamento oficial.

## Retenção

Políticas ficam em `lgpd_retention_policies`. A revisão manual cria itens em `lgpd_retention_reviews`. A Sprint 8 não executa exclusão automática.

Políticas padrão:

- currículos: revisão após 365 dias;
- trabalhadores: revisão após 730 dias;
- encaminhamentos/vagas: revisão ou arquivamento após 1095 dias;
- auditoria e acesso a dados: manutenção padrão de 1825 dias.

## Anonimização, bloqueio e exclusão

Não há exclusão física cega. Se houver vínculo operacional, obrigação legal, auditoria, candidatura ou interesse público, o fluxo deve preferir bloqueio de novos tratamentos ou anonimização.

Anonimização de trabalhador substitui nome por `Titular anonimizado`, remove contatos, mascara CPF operacional, bloqueia novos tratamentos e registra auditoria.

## Incidentes

Incidentes ficam em `lgpd_incidents`, com severidade, status, categorias afetadas, ações de contenção, necessidade de notificação e datas de comunicação.

## Atividades de tratamento

O mapa de tratamento fica em `lgpd_processing_activities`. O seed inicial cobre cadastro de trabalhador, currículo, candidatura, triagem, encaminhamento, retorno da empresa, cadastro da empresa, comunicação, relatórios e auditoria.

## IA interna

A IA é apoio interno do SINE. Ela organiza informações de currículo e sugere compatibilidade, mas não decide contratação, não elimina candidatos automaticamente e não é exibida para empresas.

## Responsabilidades dos colaboradores

- Acessar apenas dados necessários.
- Não enviar currículos por canais informais.
- Registrar visualização sensível.
- Usar exportação apenas para solicitação formal ou finalidade operacional.
- Encaminhar pedidos de exclusão/anonimização ao encarregado.

## Pontos futuros

- Parametrizar prazo de resposta por tenant.
- Criar download seguro de pacote de portabilidade.
- Implementar política formal de descarte com dupla aprovação.
- Integrar notificações por e-mail para encarregado e titular.
