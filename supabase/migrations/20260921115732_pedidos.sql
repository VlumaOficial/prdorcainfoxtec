-- Modulo de Pedidos: orcamento aprovado gera um ou mais pedidos vinculados (1:N, suporta
-- parcial). Ver docs/PEDIDOS.md para a especificacao completa por tras destas regras.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET row_security = off;


CREATE TABLE IF NOT EXISTS "public"."pedidos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "empresa_id" "uuid" NOT NULL,
    "orcamento_id" "uuid" NOT NULL,
    "numero" "text" NOT NULL,
    "status" "text" DEFAULT 'em_execucao'::"text" NOT NULL,
    "data_criacao" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data_entrega" "date",
    "data_faturamento" "date",
    "numero_nf" "text",
    "serie_nf" "text",
    "valor_faturado" numeric(12,2),
    "chave_acesso_nf" "text",
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."pedidos" OWNER TO "postgres";

COMMENT ON TABLE "public"."pedidos" IS 'Pedidos gerados a partir de orcamentos aprovados. Um orcamento pode gerar varios pedidos (entrega parcial); itens nao se duplicam aqui, sao referenciados via pedido_itens.';


CREATE TABLE IF NOT EXISTS "public"."pedido_itens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pedido_id" "uuid" NOT NULL,
    "orcamento_item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."pedido_itens" OWNER TO "postgres";

COMMENT ON TABLE "public"."pedido_itens" IS 'Vincula itens do orcamento a um pedido. Um orcamento_item_id so pode estar num pedido nao-cancelado por vez (regra aplicada nas RPCs, nao por constraint).';


ALTER TABLE ONLY "public"."pedidos"
    ADD CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pedido_itens"
    ADD CONSTRAINT "pedido_itens_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."pedidos"
    ADD CONSTRAINT "pedidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pedidos"
    ADD CONSTRAINT "pedidos_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pedido_itens"
    ADD CONSTRAINT "pedido_itens_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pedido_itens"
    ADD CONSTRAINT "pedido_itens_orcamento_item_id_fkey" FOREIGN KEY ("orcamento_item_id") REFERENCES "public"."orcamento_itens"("id") ON DELETE CASCADE;


CREATE INDEX "idx_pedidos_orcamento" ON "public"."pedidos" USING "btree" ("orcamento_id");
CREATE INDEX "idx_pedidos_empresa" ON "public"."pedidos" USING "btree" ("empresa_id");
CREATE INDEX "idx_pedidos_status" ON "public"."pedidos" USING "btree" ("empresa_id", "status");
CREATE INDEX "idx_pedido_itens_pedido" ON "public"."pedido_itens" USING "btree" ("pedido_id");
CREATE INDEX "idx_pedido_itens_orcamento_item" ON "public"."pedido_itens" USING "btree" ("orcamento_item_id");


CREATE OR REPLACE TRIGGER "trg_pedidos_updated" BEFORE UPDATE ON "public"."pedidos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


ALTER TABLE "public"."pedidos" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_select" ON "public"."pedidos" FOR SELECT USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));

CREATE POLICY "pedidos_insert" ON "public"."pedidos" FOR INSERT WITH CHECK (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));

CREATE POLICY "pedidos_update" ON "public"."pedidos" FOR UPDATE USING (("empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
   FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))));


ALTER TABLE "public"."pedido_itens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedido_itens_select" ON "public"."pedido_itens" FOR SELECT USING (("pedido_id" IN ( SELECT "pedidos"."id"
   FROM "public"."pedidos"
  WHERE ("pedidos"."empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
           FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))))));

CREATE POLICY "pedido_itens_insert" ON "public"."pedido_itens" FOR INSERT WITH CHECK (("pedido_id" IN ( SELECT "pedidos"."id"
   FROM "public"."pedidos"
  WHERE ("pedidos"."empresa_id" = ( SELECT "get_meu_perfil"."empresa_id"
           FROM "public"."get_meu_perfil"() "get_meu_perfil"("usuario_id", "empresa_id", "nome", "email"))))));


GRANT ALL ON TABLE "public"."pedidos" TO "anon";
GRANT ALL ON TABLE "public"."pedidos" TO "authenticated";
GRANT ALL ON TABLE "public"."pedidos" TO "service_role";

GRANT ALL ON TABLE "public"."pedido_itens" TO "anon";
GRANT ALL ON TABLE "public"."pedido_itens" TO "authenticated";
GRANT ALL ON TABLE "public"."pedido_itens" TO "service_role";


-- ── RPCs ──────────────────────────────────────────────────────────────────

-- Itens do orcamento que ainda nao estao vinculados a nenhum pedido nao-cancelado.
-- Centraliza a regra de exclusividade: usada tanto pra popular a tela de selecao
-- quanto pela validacao dentro de criar_pedido.
CREATE OR REPLACE FUNCTION "public"."itens_disponiveis_orcamento"("p_orcamento_id" "uuid")
RETURNS SETOF "public"."orcamento_itens"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select oi.*
  from orcamento_itens oi
  join orcamentos o on o.id = oi.orcamento_id
  where oi.orcamento_id = p_orcamento_id
    and o.empresa_id = (select empresa_id from get_meu_perfil())
    and not exists (
      select 1
      from pedido_itens pi
      join pedidos p on p.id = pi.pedido_id
      where pi.orcamento_item_id = oi.id
        and p.status != 'cancelado'
    )
  order by oi.ordem;
$$;

ALTER FUNCTION "public"."itens_disponiveis_orcamento"("p_orcamento_id" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."itens_disponiveis_orcamento"("p_orcamento_id" "uuid") IS 'Itens do orcamento ainda sem pedido ativo vinculado. Usado pela tela de selecao de itens e pela validacao de criar_pedido.';


-- Cria um pedido a partir de um subconjunto de itens de um orcamento aprovado.
-- Numeracao: reaproveita o numero do orcamento (ORC-AAAA-NNN -> PED-AAAA-NNN-XX),
-- sempre com sufixo sequencial de 2 digitos, mesmo no primeiro pedido.
CREATE OR REPLACE FUNCTION "public"."criar_pedido"("p_orcamento_id" "uuid", "p_itens_ids" "uuid"[])
RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_orcamento record;
  v_empresa_id uuid;
  v_seq int;
  v_numero text;
  v_pedido_id uuid;
  v_item_id uuid;
  v_disponiveis uuid[];
begin
  select * into v_orcamento from orcamentos where id = p_orcamento_id;
  if not found or v_orcamento.empresa_id != (select empresa_id from get_meu_perfil()) then
    raise exception 'Orcamento nao encontrado.';
  end if;

  if v_orcamento.status != 'aprovado' then
    raise exception 'So e possivel gerar pedido a partir de um orcamento aprovado.';
  end if;

  if p_itens_ids is null or array_length(p_itens_ids, 1) is null then
    raise exception 'Selecione ao menos um item para gerar o pedido.';
  end if;

  -- Todos os itens pedidos precisam pertencer a este orcamento e estar disponiveis
  -- (sem vinculo com pedido ativo). Reusa itens_disponiveis_orcamento como fonte da verdade.
  select array_agg(id) into v_disponiveis
  from itens_disponiveis_orcamento(p_orcamento_id);

  foreach v_item_id in array p_itens_ids loop
    if v_disponiveis is null or not (v_item_id = any(v_disponiveis)) then
      raise exception 'Item % nao pertence a este orcamento ou ja esta vinculado a outro pedido.', v_item_id;
    end if;
  end loop;

  v_empresa_id := v_orcamento.empresa_id;

  select count(*) + 1 into v_seq from pedidos where orcamento_id = p_orcamento_id;
  v_numero := replace(v_orcamento.numero, 'ORC-', 'PED-') || '-' || lpad(v_seq::text, 2, '0');

  insert into pedidos (empresa_id, orcamento_id, numero, status)
  values (v_empresa_id, p_orcamento_id, v_numero, 'em_execucao')
  returning id into v_pedido_id;

  foreach v_item_id in array p_itens_ids loop
    insert into pedido_itens (pedido_id, orcamento_item_id) values (v_pedido_id, v_item_id);
  end loop;

  return v_pedido_id;
end;
$$;

ALTER FUNCTION "public"."criar_pedido"("p_orcamento_id" "uuid", "p_itens_ids" "uuid"[]) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."criar_pedido"("p_orcamento_id" "uuid", "p_itens_ids" "uuid"[]) IS 'Gera um pedido a partir de itens ainda nao vinculados de um orcamento aprovado. Suporta pedidos parciais (multiplos pedidos por orcamento).';


-- Cancela um pedido. Faturado nunca pode ser cancelado. Se era o ultimo pedido
-- ativo/faturado do orcamento, cancela o orcamento tambem (cascata).
CREATE OR REPLACE FUNCTION "public"."cancelar_pedido"("p_id" "uuid")
RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_pedido record;
  v_outros_ativos int;
begin
  select * into v_pedido from pedidos where id = p_id;
  if not found or v_pedido.empresa_id != (select empresa_id from get_meu_perfil()) then
    raise exception 'Pedido nao encontrado.';
  end if;

  if v_pedido.status = 'faturado' then
    raise exception 'Pedido faturado nao pode ser cancelado.';
  end if;

  update pedidos set status = 'cancelado' where id = p_id;

  select count(*) into v_outros_ativos
  from pedidos
  where orcamento_id = v_pedido.orcamento_id
    and id != p_id
    and status != 'cancelado';

  if v_outros_ativos = 0 then
    update orcamentos set status = 'cancelado' where id = v_pedido.orcamento_id;
  end if;
end;
$$;

ALTER FUNCTION "public"."cancelar_pedido"("p_id" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."cancelar_pedido"("p_id" "uuid") IS 'Cancela o pedido; se nao restar nenhum outro pedido ativo/faturado do mesmo orcamento, cancela o orcamento tambem.';


-- Cancela um orcamento. Bloqueado se algum pedido vinculado ja estiver faturado.
-- Cascateia cancelamento para todos os pedidos vinculados ainda nao-faturados.
CREATE OR REPLACE FUNCTION "public"."cancelar_orcamento"("p_id" "uuid")
RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_orcamento record;
  v_faturados int;
begin
  select * into v_orcamento from orcamentos where id = p_id;
  if not found or v_orcamento.empresa_id != (select empresa_id from get_meu_perfil()) then
    raise exception 'Orcamento nao encontrado.';
  end if;

  select count(*) into v_faturados from pedidos where orcamento_id = p_id and status = 'faturado';

  if v_faturados > 0 then
    raise exception 'Nao e possivel cancelar: existe pedido ja faturado vinculado a este orcamento.';
  end if;

  update orcamentos set status = 'cancelado' where id = p_id;

  update pedidos
  set status = 'cancelado'
  where orcamento_id = p_id
    and status not in ('cancelado', 'faturado');
end;
$$;

ALTER FUNCTION "public"."cancelar_orcamento"("p_id" "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."cancelar_orcamento"("p_id" "uuid") IS 'Cancela o orcamento e todos os pedidos vinculados ainda nao-faturados. Bloqueia se ja houver pedido faturado.';


GRANT ALL ON FUNCTION "public"."itens_disponiveis_orcamento"("p_orcamento_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."itens_disponiveis_orcamento"("p_orcamento_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."itens_disponiveis_orcamento"("p_orcamento_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."criar_pedido"("p_orcamento_id" "uuid", "p_itens_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."criar_pedido"("p_orcamento_id" "uuid", "p_itens_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."criar_pedido"("p_orcamento_id" "uuid", "p_itens_ids" "uuid"[]) TO "service_role";

GRANT ALL ON FUNCTION "public"."cancelar_pedido"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancelar_pedido"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancelar_pedido"("p_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."cancelar_orcamento"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancelar_orcamento"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancelar_orcamento"("p_id" "uuid") TO "service_role";
