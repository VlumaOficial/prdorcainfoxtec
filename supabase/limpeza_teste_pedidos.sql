-- Limpeza dos dados criados durante os testes end-to-end do modulo de Pedidos.
-- Filtra por ID exato (capturado durante o proprio teste), nao por nome/numero — nomes
-- genericos tipo "Item A"/"Item B" sao arriscados demais pra confiar em DELETE por nome.
-- Rodar os DELETEs de uma rodada que ja foi limpa antes e inofensivo (WHERE id IN nao acha
-- nada, no-op).

-- ── Passo 1: conferir visualmente ANTES de apagar (rode so os SELECTs primeiro) ──

select id, numero, titulo, cliente_nome, status from orcamentos
where id in (
  '8d3c0120-4660-4d6e-b447-c28f3c0aaa38', -- ORC-2026-054 (rodada 1)
  'e4005ec6-2541-41c9-a141-076cd22b45a7', -- ORC-2026-055 (rodada 2)
  'd5a41920-57a3-4553-9324-87a7259d2063'  -- ORC-2026-054 (rodada 3 - protecao orcamento/pedido)
);

select id, numero, status from pedidos
where id in (
  '3dbaa800-b422-4d28-b1e3-a8a2953d8dfa', -- PED-2026-054-01 (rodada 1)
  '4e9911e8-33df-4963-a4ac-f62bc851385e', -- PED-2026-055-01 (rodada 2)
  '1eb320d0-4367-4a91-ad51-41ad799c25e0', -- PED-2026-055-02 (rodada 2)
  '2829acab-3f12-4a77-a9f3-14820df85b90'  -- PED-2026-054-01 (rodada 3)
);

-- Cliente e produtos vinculados aos MEUS orcamentos de teste, encontrados pelo ID
-- exato do orcamento (nao pelo nome do cliente/produto).
select id, nome from clientes where id in (
  select cliente_id from orcamentos
  where id in (
    '8d3c0120-4660-4d6e-b447-c28f3c0aaa38',
    'e4005ec6-2541-41c9-a141-076cd22b45a7',
    'd5a41920-57a3-4553-9324-87a7259d2063'
  ) and cliente_id is not null
);

select id, nome from produtos where id in (
  select produto_id from orcamento_itens
  where orcamento_id in (
    '8d3c0120-4660-4d6e-b447-c28f3c0aaa38',
    'e4005ec6-2541-41c9-a141-076cd22b45a7',
    'd5a41920-57a3-4553-9324-87a7259d2063'
  ) and produto_id is not null
);

-- ── Passo 2: se os SELECTs acima mostrarem so orcamentos/pedidos/cliente/produtos de teste
--    (nada real misturado), rode os DELETEs abaixo. Ordem importa: cliente/produto primeiro
--    (dependem dos orcamentos ainda existirem pra achar o ID certo), pedidos e orcamentos por
--    ultimo (a FK pedidos->orcamentos agora e RESTRICT, entao o pedido tem que sair antes). ──

delete from produtos where id in (
  select produto_id from orcamento_itens
  where orcamento_id in (
    '8d3c0120-4660-4d6e-b447-c28f3c0aaa38',
    'e4005ec6-2541-41c9-a141-076cd22b45a7',
    'd5a41920-57a3-4553-9324-87a7259d2063'
  ) and produto_id is not null
);

delete from clientes where id in (
  select cliente_id from orcamentos
  where id in (
    '8d3c0120-4660-4d6e-b447-c28f3c0aaa38',
    'e4005ec6-2541-41c9-a141-076cd22b45a7',
    'd5a41920-57a3-4553-9324-87a7259d2063'
  ) and cliente_id is not null
);

delete from pedidos where id in (
  '3dbaa800-b422-4d28-b1e3-a8a2953d8dfa',
  '4e9911e8-33df-4963-a4ac-f62bc851385e',
  '1eb320d0-4367-4a91-ad51-41ad799c25e0',
  '2829acab-3f12-4a77-a9f3-14820df85b90'
);

delete from orcamentos where id in (
  '8d3c0120-4660-4d6e-b447-c28f3c0aaa38',
  'e4005ec6-2541-41c9-a141-076cd22b45a7',
  'd5a41920-57a3-4553-9324-87a7259d2063'
);
