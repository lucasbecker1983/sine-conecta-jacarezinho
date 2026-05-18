# Multi-Tenant

O tenant inicial é:

- nome: SINE Jacarezinho
- slug: jacarezinho
- cidade: Jacarezinho
- estado: PR
- domínio: sine.jacarezinho.cloud

Todas as tabelas operacionais possuem `tenant_id`.

As rotas filtram os dados pelo tenant do usuário autenticado. `super_admin` é reservado para a gestão futura do SaaS, enquanto `tenant_admin` administra o ambiente de Jacarezinho.

O white label usa campos da tabela `tenants`: logo, cores, nome, domínio e rodapé.
