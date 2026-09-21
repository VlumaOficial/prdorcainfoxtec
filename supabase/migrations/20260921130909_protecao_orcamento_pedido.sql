-- Protege a integridade entre orcamento e pedido em dois pontos que a migration anterior
-- (20260921115732_pedidos.sql) deixou em aberto. Ver docs/PEDIDOS.md secao 12.
--
-- 1. atualizar_orcamento sempre apagava e recriava TODOS os orcamento_itens a cada "Salvar
--    Alteracoes" -- como pedido_itens.orcamento_item_id tem ON DELETE CASCADE, isso quebrava
--    silenciosamente o vinculo de qualquer pedido ja gerado. Agora, se o orcamento tem pedido
--    vinculado (qualquer status, inclusive cancelado, pra preservar historico), os itens ficam
--    intocados no banco -- o payload de itens enviado e ignorado nesse caso.
--
-- 2. pedidos_orcamento_id_fkey estava ON DELETE CASCADE -- excluir um orcamento apagava
--    silenciosamente qualquer pedido vinculado, inclusive um ja Faturado, contornando a
--    protecao que existe pro cancelamento. Trocado para RESTRICT: o banco recusa a exclusao
--    enquanto existir qualquer pedido vinculado.

SET row_security = off;

CREATE OR REPLACE FUNCTION "public"."atualizar_orcamento"("p_id" "uuid", "p_orcamento" "jsonb", "p_itens" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_item jsonb;
  v_ordem int := 0;
  v_tem_pedido boolean;
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

  select exists(select 1 from public.pedidos where orcamento_id = p_id) into v_tem_pedido;

  -- So mexe nos itens se NENHUM pedido estiver vinculado a este orcamento.
  if not v_tem_pedido then
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
  end if;

  return p_id;
end;
$$;

COMMENT ON FUNCTION "public"."atualizar_orcamento"("p_id" "uuid", "p_orcamento" "jsonb", "p_itens" "jsonb") IS 'Atualiza cabecalho e itens do orcamento. Se ja existir pedido vinculado (qualquer status), os itens ficam travados -- o payload de itens e ignorado, so o cabecalho e atualizado.';


ALTER TABLE "public"."pedidos" DROP CONSTRAINT "pedidos_orcamento_id_fkey";

ALTER TABLE ONLY "public"."pedidos"
    ADD CONSTRAINT "pedidos_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "public"."orcamentos"("id") ON DELETE RESTRICT;
