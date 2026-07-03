


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Extensoes necessarias (adicionadas manualmente: o db dump nao as incluiu)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";



CREATE OR REPLACE FUNCTION "public"."anos_com_orcamentos"() RETURNS TABLE("ano" integer)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select distinct extract(year from data_emissao)::int as ano
  from public.orcamentos
  where data_emissao is not null
  order by ano desc
$$;


ALTER FUNCTION "public"."anos_com_orcamentos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_orcamento"("p_id" "uuid", "p_orcamento" "jsonb", "p_itens" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_item jsonb;
  v_ordem int := 0;
begin
  update public.orcamentos set
    cliente_id = nullif(p_orcamento->>'cliente_id','')::uuid,
    numero = p_orcamento->>'numero',
    data_emissao = (p_orcamento->>'data_emissao')::date,
    validade = nullif(p_orcamento->>'validade','')::date,
    titulo = p_orcamento->>'titulo',
    observacoes_gerais = p_orcamento->>'observacoes_gerais',
    condicoes_pagamento = p_orcamento->>'condicoes_pagamento',
    email_contato = p_orcamento->>'email_contato',
    telefone_contato = p_orcamento->>'telefone_contato',
    cliente_nome = p_orcamento->>'cliente_nome',
    cliente_cnpj = p_orcamento->>'cliente_cnpj',
    cliente_endereco = p_orcamento->>'cliente_endereco',
    cliente_responsavel = p_orcamento->>'cliente_responsavel',
    cliente_email_telefone = p_orcamento->>'cliente_email_telefone',
    imposto_pct = (p_orcamento->>'imposto_pct')::numeric,
    margem_pct = (p_orcamento->>'margem_pct')::numeric,
    desconto_pct = (p_orcamento->>'desconto_pct')::numeric,
    total_custo = (p_orcamento->>'total_custo')::numeric,
    total_imposto = (p_orcamento->>'total_imposto')::numeric,
    total_desconto = (p_orcamento->>'total_desconto')::numeric,
    total_lucro = (p_orcamento->>'total_lucro')::numeric,
    total_final = (p_orcamento->>'total_final')::numeric,
    updated_at = now()
  where id = p_id;

  delete from public.orcamento_itens where orcamento_id = p_id;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    insert into public.orcamento_itens (
      orcamento_id, produto_id, descricao, qtd, custo_unit,
      usa_imp_global, imp_pct, usa_marg_global, marg_pct,
      usa_desc_global, desc_pct, desc_fix, ordem
    )
    values (
      p_id,
      nullif(v_item->>'produto_id','')::uuid,
      v_item->>'descricao',
      (v_item->>'qtd')::numeric,
      (v_item->>'custo_unit')::numeric,
      (v_item->>'usa_imp_global')::boolean,
      nullif(v_item->>'imp_pct','')::numeric,
      (v_item->>'usa_marg_global')::boolean,
      nullif(v_item->>'marg_pct','')::numeric,
      (v_item->>'usa_desc_global')::boolean,
      nullif(v_item->>'desc_pct','')::numeric,
      nullif(v_item->>'desc_fix','')::numeric,
      v_ordem
    );
    v_ordem := v_ordem + 1;
  end loop;

  return p_id;
end;
$$;


ALTER FUNCTION "public"."atualizar_orcamento"("p_id" "uuid", "p_orcamento" "jsonb", "p_itens" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_meu_perfil"() RETURNS TABLE("usuario_id" "uuid", "empresa_id" "uuid", "nome" "text", "email" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select id, empresa_id, nome, email
  from usuarios
  where id = auth.uid();
$$;


ALTER FUNCTION "public"."get_meu_perfil"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_meu_perfil"() IS 'Retorna o perfil do usuário autenticado, usado nas políticas RLS para filtrar por empresa_id sem recursão.';



CREATE OR REPLACE FUNCTION "public"."salvar_orcamento"("p_orcamento" "jsonb", "p_itens" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_orcamento_id uuid;
  v_item jsonb;
  v_ordem int := 0;
begin
  -- 1. Insere o cabecalho
  insert into public.orcamentos (
    empresa_id, cliente_id, numero, data_emissao, validade,
    titulo, observacoes_gerais, condicoes_pagamento,
    email_contato, telefone_contato,
    cliente_nome, cliente_cnpj, cliente_endereco, cliente_responsavel, cliente_email_telefone,
    imposto_pct, margem_pct, desconto_pct,
    total_custo, total_imposto, total_desconto, total_lucro, total_final,
    status, criado_por
  )
  values (
    (p_orcamento->>'empresa_id')::uuid,
    nullif(p_orcamento->>'cliente_id','')::uuid,
    p_orcamento->>'numero',
    (p_orcamento->>'data_emissao')::date,
    nullif(p_orcamento->>'validade','')::date,
    p_orcamento->>'titulo',
    p_orcamento->>'observacoes_gerais',
    p_orcamento->>'condicoes_pagamento',
    p_orcamento->>'email_contato',
    p_orcamento->>'telefone_contato',
    p_orcamento->>'cliente_nome',
    p_orcamento->>'cliente_cnpj',
    p_orcamento->>'cliente_endereco',
    p_orcamento->>'cliente_responsavel',
    p_orcamento->>'cliente_email_telefone',
    (p_orcamento->>'imposto_pct')::numeric,
    (p_orcamento->>'margem_pct')::numeric,
    (p_orcamento->>'desconto_pct')::numeric,
    (p_orcamento->>'total_custo')::numeric,
    (p_orcamento->>'total_imposto')::numeric,
    (p_orcamento->>'total_desconto')::numeric,
    (p_orcamento->>'total_lucro')::numeric,
    (p_orcamento->>'total_final')::numeric,
    coalesce(p_orcamento->>'status','rascunho'),
    nullif(p_orcamento->>'criado_por','')::uuid
  )
  returning id into v_orcamento_id;

  -- 2. Insere os itens
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    insert into public.orcamento_itens (
      orcamento_id, produto_id, descricao, qtd, custo_unit,
      usa_imp_global, imp_pct, usa_marg_global, marg_pct,
      usa_desc_global, desc_pct, desc_fix, ordem
    )
    values (
      v_orcamento_id,
      nullif(v_item->>'produto_id','')::uuid,
      v_item->>'descricao',
      (v_item->>'qtd')::numeric,
      (v_item->>'custo_unit')::numeric,
      (v_item->>'usa_imp_global')::boolean,
      nullif(v_item->>'imp_pct','')::numeric,
      (v_item->>'usa_marg_global')::boolean,
      nullif(v_item->>'marg_pct','')::numeric,
      (v_item->>'usa_desc_global')::boolean,
      nullif(v_item->>'desc_pct','')::numeric,
      nullif(v_item->>'desc_fix','')::numeric,
      v_ordem
    );
    v_ordem := v_ordem + 1;
  end loop;

  return v_orcamento_id;
end;
$$;


ALTER FUNCTION "public"."salvar_orcamento"("p_orcamento" "jsonb", "p_itens" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sugerir_numero_orcamento"("p_empresa_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_ano   text := to_char(current_date, 'YYYY');
  v_seq   integer;
  v_numero text;
begin
  select count(*) + 1 into v_seq
  from orcamentos
  where empresa_id = p_empresa_id
    and numero like 'ORC-' || v_ano || '-%';

  v_numero := 'ORC-' || v_ano || '-' || lpad(v_seq::text, 3, '0');
  return v_numero;
end;
$$;


ALTER FUNCTION "public"."sugerir_numero_orcamento"("p_empresa_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sugerir_numero_orcamento"("p_empresa_id" "uuid") IS 'Gera sugestão de número sequencial (ex: ORC-2026-003). Usuário pode editar livremente antes de salvar.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "cnpj" "text",
    "endereco" "text",
    "responsavel" "text",
    "email" "text",
    "telefone" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


COMMENT ON TABLE "public"."clientes" IS 'Clientes de cada empresa (tenant). Busca por nome/CNPJ para evitar duplicidade.';



CREATE TABLE IF NOT EXISTS "public"."empresas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" "text" NOT NULL,
    "cnpj" "text",
    "endereco" "text",
    "logo_url" "text",
    "imposto_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "margem_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "desconto_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "cor_primaria" "text" DEFAULT '#1db954'::"text",
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."empresas" OWNER TO "postgres";


COMMENT ON TABLE "public"."empresas" IS 'Tenants do sistema (empresas que usam o SaaS de orçamentos)';



CREATE TABLE IF NOT EXISTS "public"."orcamento_itens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "orcamento_id" "uuid" NOT NULL,
    "produto_id" "uuid",
    "descricao" "text" NOT NULL,
    "qtd" numeric(10,2) DEFAULT 1 NOT NULL,
    "custo_unit" numeric(12,2) DEFAULT 0 NOT NULL,
    "usa_imp_global" boolean DEFAULT true NOT NULL,
    "imp_pct" numeric(5,2),
    "usa_marg_global" boolean DEFAULT true NOT NULL,
    "marg_pct" numeric(5,2),
    "usa_desc_global" boolean DEFAULT true NOT NULL,
    "desc_pct" numeric(5,2),
    "desc_fix" numeric(12,2),
    "ordem" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."orcamento_itens" OWNER TO "postgres";


COMMENT ON TABLE "public"."orcamento_itens" IS 'Itens do orçamento. Replica exatamente a lógica de Imp/Marg/Desc validada no HTML original.';



CREATE TABLE IF NOT EXISTS "public"."orcamentos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "cliente_id" "uuid",
    "numero" "text" NOT NULL,
    "data_emissao" "date" DEFAULT CURRENT_DATE NOT NULL,
    "validade" "date",
    "titulo" "text",
    "observacoes_gerais" "text",
    "condicoes_pagamento" "text",
    "email_contato" "text",
    "telefone_contato" "text",
    "imposto_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "margem_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "desconto_pct" numeric(5,2) DEFAULT 0 NOT NULL,
    "total_custo" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_imposto" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_desconto" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_lucro" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_final" numeric(12,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'rascunho'::"text" NOT NULL,
    "criado_por" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cliente_nome" "text",
    "cliente_cnpj" "text",
    "cliente_endereco" "text",
    "cliente_responsavel" "text",
    "cliente_email_telefone" "text"
);


ALTER TABLE "public"."orcamentos" OWNER TO "postgres";


COMMENT ON TABLE "public"."orcamentos" IS 'Orçamentos gerados. Configuração de imposto/margem/desconto é snapshot no momento da criação.';



CREATE TABLE IF NOT EXISTS "public"."produtos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "custo_padrao" numeric(12,2) DEFAULT 0 NOT NULL,
    "unidade" "text" DEFAULT 'un'::"text",
    "categoria" "text",
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."produtos" OWNER TO "postgres";


COMMENT ON TABLE "public"."produtos" IS 'Catálogo de produtos/serviços reutilizável. Ao usar em orçamento, sistema sugere atualizar custo se houver divergência.';



CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id" "uuid" NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


COMMENT ON TABLE "public"."usuarios" IS 'Usuários vinculados a uma empresa (tenant). Sem hierarquia/papel — todos com mesmas permissões dentro da própria empresa.';



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."empresas"
    ADD CONSTRAINT "empresas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orcamento_itens"
    ADD CONSTRAINT "orcamento_itens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_clientes_cnpj" ON "public"."clientes" USING "btree" ("empresa_id", "cnpj");



CREATE INDEX "idx_clientes_empresa" ON "public"."clientes" USING "btree" ("empresa_id");



CREATE INDEX "idx_clientes_nome" ON "public"."clientes" USING "gin" ("nome" "public"."gin_trgm_ops");



CREATE INDEX "idx_itens_orcamento" ON "public"."orcamento_itens" USING "btree" ("orcamento_id");



CREATE INDEX "idx_itens_produto" ON "public"."orcamento_itens" USING "btree" ("produto_id");



CREATE INDEX "idx_orcamentos_cliente" ON "public"."orcamentos" USING "btree" ("cliente_id");



CREATE INDEX "idx_orcamentos_empresa" ON "public"."orcamentos" USING "btree" ("empresa_id");



CREATE INDEX "idx_orcamentos_numero" ON "public"."orcamentos" USING "btree" ("empresa_id", "numero");



CREATE INDEX "idx_orcamentos_status" ON "public"."orcamentos" USING "btree" ("empresa_id", "status");



CREATE INDEX "idx_produtos_empresa" ON "public"."produtos" USING "btree" ("empresa_id");



CREATE INDEX "idx_produtos_nome" ON "public"."produtos" USING "gin" ("nome" "public"."gin_trgm_ops");



CREATE INDEX "idx_usuarios_empresa" ON "public"."usuarios" USING "btree" ("empresa_id");



CREATE OR REPLACE TRIGGER "trg_clientes_updated" BEFORE UPDATE ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_empresas_updated" BEFORE UPDATE ON "public"."empresas" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_orcamentos_updated" BEFORE UPDATE ON "public"."orcamentos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_produtos_updated" BEFORE UPDATE ON "public"."produtos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orcamento_itens"
    ADD CONSTRAINT "orcamento_itens_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orcamento_itens"
    ADD CONSTRAINT "orcamento_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id");



ALTER TABLE ONLY "public"."orcamentos"
    ADD CONSTRAINT "orcamentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."produtos"
    ADD CONSTRAINT "produtos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clientes_delete" ON "public"."clientes" FOR DELETE USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "clientes_insert" ON "public"."clientes" FOR INSERT WITH CHECK (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "clientes_select" ON "public"."clientes" FOR SELECT USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "clientes_update" ON "public"."clientes" FOR UPDATE USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



ALTER TABLE "public"."empresas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "empresas_select" ON "public"."empresas" FOR SELECT USING (("id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "empresas_update" ON "public"."empresas" FOR UPDATE USING (("id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "itens_delete" ON "public"."orcamento_itens" FOR DELETE USING (("orcamento_id" IN ( SELECT "orcamentos"."id"
   FROM "public"."orcamentos"
  WHERE ("orcamentos"."empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
           FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))))));



CREATE POLICY "itens_insert" ON "public"."orcamento_itens" FOR INSERT WITH CHECK (("orcamento_id" IN ( SELECT "orcamentos"."id"
   FROM "public"."orcamentos"
  WHERE ("orcamentos"."empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
           FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))))));



CREATE POLICY "itens_select" ON "public"."orcamento_itens" FOR SELECT USING (("orcamento_id" IN ( SELECT "orcamentos"."id"
   FROM "public"."orcamentos"
  WHERE ("orcamentos"."empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
           FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))))));



CREATE POLICY "itens_update" ON "public"."orcamento_itens" FOR UPDATE USING (("orcamento_id" IN ( SELECT "orcamentos"."id"
   FROM "public"."orcamentos"
  WHERE ("orcamentos"."empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
           FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))))));



ALTER TABLE "public"."orcamento_itens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orcamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orcamentos_delete" ON "public"."orcamentos" FOR DELETE USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "orcamentos_insert" ON "public"."orcamentos" FOR INSERT WITH CHECK (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "orcamentos_select" ON "public"."orcamentos" FOR SELECT USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "orcamentos_update" ON "public"."orcamentos" FOR UPDATE USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



ALTER TABLE "public"."produtos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "produtos_delete" ON "public"."produtos" FOR DELETE USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "produtos_insert" ON "public"."produtos" FOR INSERT WITH CHECK (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "produtos_select" ON "public"."produtos" FOR SELECT USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "produtos_update" ON "public"."produtos" FOR UPDATE USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios_select" ON "public"."usuarios" FOR SELECT USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));



CREATE POLICY "usuarios_update_self" ON "public"."usuarios" FOR UPDATE USING (("id" = "auth"."uid"()));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."anos_com_orcamentos"() TO "anon";
GRANT ALL ON FUNCTION "public"."anos_com_orcamentos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."anos_com_orcamentos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."atualizar_orcamento"("p_id" "uuid", "p_orcamento" "jsonb", "p_itens" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."atualizar_orcamento"("p_id" "uuid", "p_orcamento" "jsonb", "p_itens" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."atualizar_orcamento"("p_id" "uuid", "p_orcamento" "jsonb", "p_itens" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_meu_perfil"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_meu_perfil"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_meu_perfil"() TO "service_role";



GRANT ALL ON FUNCTION "public"."salvar_orcamento"("p_orcamento" "jsonb", "p_itens" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."salvar_orcamento"("p_orcamento" "jsonb", "p_itens" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."salvar_orcamento"("p_orcamento" "jsonb", "p_itens" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sugerir_numero_orcamento"("p_empresa_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sugerir_numero_orcamento"("p_empresa_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sugerir_numero_orcamento"("p_empresa_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."empresas" TO "anon";
GRANT ALL ON TABLE "public"."empresas" TO "authenticated";
GRANT ALL ON TABLE "public"."empresas" TO "service_role";



GRANT ALL ON TABLE "public"."orcamento_itens" TO "anon";
GRANT ALL ON TABLE "public"."orcamento_itens" TO "authenticated";
GRANT ALL ON TABLE "public"."orcamento_itens" TO "service_role";



GRANT ALL ON TABLE "public"."orcamentos" TO "anon";
GRANT ALL ON TABLE "public"."orcamentos" TO "authenticated";
GRANT ALL ON TABLE "public"."orcamentos" TO "service_role";



GRANT ALL ON TABLE "public"."produtos" TO "anon";
GRANT ALL ON TABLE "public"."produtos" TO "authenticated";
GRANT ALL ON TABLE "public"."produtos" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







