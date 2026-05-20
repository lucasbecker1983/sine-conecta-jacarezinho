# Segurança

## Perfis de acesso

- `super_admin`: operação SaaS e status interno.
- `tenant_admin`: administração do tenant, status interno e exportações.
- `sine_manager`: gestão SINE e exportações.
- `sine_staff`: operação SINE, triagem e relatórios sem exportação.
- `company_user`: portal da empresa.
- `worker`: portal do trabalhador.

## Regras críticas

- Empresa não acessa IA interna.
- Empresa só vê candidatos encaminhados oficialmente.
- Trabalhador não acessa triagem interna.
- Relatórios e triagem respeitam `tenant_id`.
- Exportação CSV registra `audit_log`.
- Visualização de currículo registra `data_access_log`.

## Senhas e tokens

Senhas usam hash Argon2id. Troca de senha exige senha atual. `JWT_SECRET` deve ser forte e estar apenas no `.env`.

## Rate limit

Login possui limite básico em memória: 5 tentativas por IP/e-mail em 5 minutos, com registro em `security.log`.

## Upload seguro

Currículos aceitam apenas PDF, validam MIME/extensão, limitam tamanho, sanitizam nome e ficam fora da pasta pública.

## Headers e CORS

Produção não aceita CORS `*`. Headers básicos de segurança são aplicados no FastAPI e no Nginx.

## LGPD

Aceite LGPD fica em `lgpd_consents`. Dados pessoais não devem ser exportados sem finalidade operacional clara.
