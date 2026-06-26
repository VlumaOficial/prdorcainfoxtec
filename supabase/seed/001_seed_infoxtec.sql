-- ════════════════════════════════════════════════════════════
-- SEED: Empresa inicial — Infoxtec Tecnologia e Serviços
-- Rodar DEPOIS de 001_schema_inicial.sql
-- ════════════════════════════════════════════════════════════

insert into empresas (nome, cnpj, endereco, imposto_pct, margem_pct, desconto_pct)
values (
  'Infoxtec Tecnologia e Serviços Ltda',
  '04.309.223/0001-96',
  'Rua Silveira Martins, nº 27, Cabula — CEP 41150-000, Salvador/BA',
  30,   -- imposto_pct padrão (ajustar se necessário)
  20,   -- margem_pct padrão
  0     -- desconto_pct padrão
)
returning id;  -- copie esse UUID retornado, vai precisar no próximo passo

-- ════════════════════════════════════════════════════════════
-- PRÓXIMO PASSO (fazer fora deste script, no painel Supabase):
-- 1. Vá em Authentication > Users > Add user
--    Crie seu login (email + senha)
-- 2. Copie o UUID gerado para esse usuário
-- 3. Rode o insert abaixo substituindo os dois UUIDs:
-- ════════════════════════════════════════════════════════════

-- insert into usuarios (id, empresa_id, nome, email)
-- values (
--   '<<UUID_DO_AUTH_USER>>',
--   '<<UUID_DA_EMPRESA_RETORNADO_ACIMA>>',
--   'Sérgio Dórea',
--   '<<SEU_EMAIL>>'
-- );
