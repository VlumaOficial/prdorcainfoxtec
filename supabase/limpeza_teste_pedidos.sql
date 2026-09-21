-- Limpeza dos dados criados durante os testes end-to-end do modulo de Pedidos
-- (duas rodadas: pedido unico e pedidos parciais/multiplos + painel de PDF).
-- Rode isso no SQL Editor do Supabase Studio. Seguro: filtra por nomes/numeros
-- especificos dos testes, nao apaga nada alem disso.

-- ── Rodada 1: pedido unico (ORC-2026-054 / PED-2026-054-01) ──
delete from pedidos where numero = 'PED-2026-054-01';
delete from orcamentos where numero = 'ORC-2026-054';
delete from clientes where nome = 'CLIENTE TESTE AUTOMATIZADO';
delete from produtos where nome = 'Item de teste 1';

-- ── Rodada 2: pedidos parciais/multiplos + painel de PDF (ORC-2026-055 / PED-2026-055-01 e -02) ──
delete from pedidos where numero in ('PED-2026-055-01', 'PED-2026-055-02');
delete from orcamentos where numero = 'ORC-2026-055';
delete from clientes where nome = 'CLIENTE TESTE E2E PARCIAL';
delete from produtos where nome in ('Item A', 'Item B');
