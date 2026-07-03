-- Seed de PRODUCAO — registros-base minimos para o sistema operar.
-- NAO inclui dados de teste (clientes/produtos/orcamentos ficam vazios).
-- IMPORTANTE: o usuario admin deve ser criado ANTES em Authentication > Users
-- (o UUID abaixo e o gerado pelo Supabase Auth do PRD).

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

-- Perfil do admin — UUID do auth.users do PRD (Auto Confirm criado no painel)
insert into public.usuarios (
  id, empresa_id, nome, email, ativo
) values (
  'aea79981-73a0-4ab1-9fdc-aeaa98695134',
  '24c1f3b2-aacc-4717-9de7-3dacab50fb91',
  'adm',
  'adm@infoxtec.com.br',
  true
)
on conflict (id) do nothing;
