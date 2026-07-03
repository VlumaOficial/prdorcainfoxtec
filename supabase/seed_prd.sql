-- Seed de PRODUCAO — registros-base minimos para o sistema operar.
-- Reusa os mesmos UUIDs do ambiente de homologacao (decisao: Opcao 1).
-- NAO inclui dados de teste (clientes/produtos/orcamentos ficam vazios).

-- Empresa Infoxtec (com configuracoes padrao de imposto/margem)
insert into public.empresas (
  id, nome, cnpj, endereco, logo_url,
  imposto_pct, margem_pct, desconto_pct, cor_primaria, ativo
) values (
  '24c1f3b2-aacc-4717-9de7-3dacab50fb91',
  'Infoxtec Tecnologia e Serviços Ltda',
  '04.309.223/0001-96',
  'Rua Silveira Martins, nº 27, Cabula — CEP 41150-000, Salvador/BA',
  null,
  30.00, 20.00, 0.00, '#1db954', true
)
on conflict (id) do nothing;

-- Usuario-perfil admin (o registro em auth.users deve ser criado separadamente)
insert into public.usuarios (
  id, empresa_id, nome, email, ativo
) values (
  '3c0646f0-28ec-4d86-af41-cb8eee4e30d3',
  '24c1f3b2-aacc-4717-9de7-3dacab50fb91',
  'adm',
  'adm@infoxtec.com.br',
  true
)
on conflict (id) do nothing;
