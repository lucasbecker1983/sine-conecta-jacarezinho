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
