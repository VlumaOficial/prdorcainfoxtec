-- Limpeza do orcamento de teste criado ao validar o rascunho local (ORC-2026-061).
-- Mesmo padrao de seguranca dos scripts anteriores: SELECT pra conferir antes, DELETE por
-- ID exato depois. Sem pedido vinculado a este, entao nao ha a restricao de FK RESTRICT em jogo.

select id, numero, titulo, cliente_nome, status from orcamentos
where id = '28412c68-387b-4ed5-888c-74578fb9539f';

select id, nome from clientes where id in (
  select cliente_id from orcamentos where id = '28412c68-387b-4ed5-888c-74578fb9539f' and cliente_id is not null
);

select id, nome from produtos where id in (
  select produto_id from orcamento_itens where orcamento_id = '28412c68-387b-4ed5-888c-74578fb9539f' and produto_id is not null
);

-- Se os 3 SELECTs acima mostrarem so o orcamento/cliente/produto de teste (ORC-2026-061,
-- "CLIENTE TESTE RASCUNHO", "Item Rascunho"), rode os DELETEs:

delete from produtos where id in (
  select produto_id from orcamento_itens where orcamento_id = '28412c68-387b-4ed5-888c-74578fb9539f' and produto_id is not null
);

delete from clientes where id in (
  select cliente_id from orcamentos where id = '28412c68-387b-4ed5-888c-74578fb9539f' and cliente_id is not null
);

delete from orcamentos where id = '28412c68-387b-4ed5-888c-74578fb9539f';
