# UX Premium — Sprint 9

## Princípios visuais

O SINE Conecta Jacarezinho deve parecer público, confiável e humano: telas claras, hierarquia objetiva, linguagem acolhedora, foco visível e ações principais fáceis de encontrar. O visual usa verde institucional com apoio de tons neutros, alertas semânticos e cards com bordas discretas para evitar telas cruas.

## Linguagem do sistema

- Mensagens de erro devem explicar o problema sem jargão técnico.
- Estados vazios devem orientar o próximo passo.
- Avisos sobre IA devem reforçar que ela é apoio interno do SINE e que a decisão final é humana.
- LGPD deve ser explicada com transparência, sem juridiquês desnecessário.

## Componentes criados

Design system em `frontend/src/components/ui/`:

- `AppButton`, `AppCard`, `AppBadge`, `AppAlert`;
- `AppInput`, `AppSelect`, `AppTextarea`;
- `AppModal`, `AppTabs`, `AppTable`, `AppTooltip`;
- `AppStepper`, `AppPageHeader`, `AppMetricCard`;
- `AppEmptyState`, `AppLoadingState`, `AppErrorState`, `AppPermissionDenied`;
- `AppSectionTitle`, `AppStatusTimeline`, `AppHelpHint`.

Onboarding:

- `OnboardingChecklist`;
- `OnboardingCard`;
- estado local por perfil em `localStorage`.

White label:

- `tenantTheme.ts`;
- `useTenantTheme.ts`;
- `theme.ts` centralizado para CSS variables.

Status:

- `frontend/src/utils/statusLabels.ts` padroniza status técnicos em textos amigáveis e badges.

## Estados vazios, loading e erro

As páginas principais passam a usar estados mais humanos, evitando tela branca ou mensagens frias. Exemplos:

- “Não encontramos vagas com esses filtros.”
- “Ainda não há dados para exibir.”
- “Não foi possível carregar os dados agora.”
- “Você não tem permissão para acessar esta área.”

## Acessibilidade

Melhorias aplicadas:

- foco visível global;
- botões com `aria-label` no menu mobile;
- inputs com labels;
- cores semânticas acompanhadas de texto;
- links e botões com áreas clicáveis maiores;
- layout responsivo com menu mobile;
- respeito a `prefers-reduced-motion`.

Checklist manual básico:

- navegação por Tab nas telas principais;
- foco visível em botões, links e inputs;
- leitura visual de contraste;
- telas mobile sem sobreposição de cards ou filtros.

## Responsividade

O layout principal recebeu menu mobile no `AppLayout`. Cards, filtros e ações passam a empilhar em telas menores. O portal público, login, cadastro do trabalhador, dashboards, triagem, relatórios e LGPD foram revisados para manter leitura e toque confortável em celular.

## Orientação por perfil

Trabalhador:

- candidatura, currículo, vagas, encaminhamentos e privacidade aparecem como caminhos claros;
- timeline explica o fluxo da candidatura.

Empresa:

- onboarding orienta cadastro, LGPD, solicitação de vaga e retorno;
- bloqueio por feedback usa linguagem colaborativa.

SINE:

- painel operacional destaca fila de trabalho, triagem, relatórios e LGPD;
- aviso da IA permanece visível e humanizado.

## Uso de Canvas

Os Canvas existentes foram preservados como apoio visual leve em login, portal público, dashboard, triagem e relatórios. A regra é não competir com o conteúdo principal, não quebrar mobile e não criar dependência para compreender a tela.

## Próximas melhorias

- auditoria visual com Lighthouse/axe em ambiente de staging;
- testes Playwright para fluxos críticos com screenshots mobile;
- tema white label editável por tenant no painel administrativo;
- biblioteca interna de exemplos para novos componentes;
- refinamento de tabelas longas para modo card em mobile.
