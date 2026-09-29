# Backlog — Sistema de Orçamento Infoxtec

Itens identificados mas adiados deliberadamente, com a fase em que devem ser retomados.

## Em hold

### Endereco do cliente na tela de Clientes
- **Quando retomar:** refinamento futuro da tela de Clientes
- **Situacao:** o endereco cadastrado nao aparece na listagem de Clientes, so ao abrir a edicao
- **Baixa prioridade:** nao bloqueia o fluxo de orcamento

## Concluído
(itens movidos para aqui conforme forem implementados)

### Modulo de Pedidos (orcamento aprovado -> pedido)
- **Especificacao completa:** [docs/PEDIDOS.md](PEDIDOS.md)
- **Resumo:** orcamento aprovado gera pedido(s) vinculados (1:N, suporta parcial), com
  numeracao derivada (PED-AAAA-NNN-XX), maquina de estados propria (Em Execucao / Entregue /
  Faturado / Cancelado), cancelamento em cascata ajustado para multiplos pedidos por orcamento,
  modal de dados fiscais no faturamento e painel de configuracao do PDF no pedido
- **Testado end-to-end em producao** em 2026-09-21 (ver docs/PEDIDOS.md secao 11)

### Protecao de integridade orcamento<->pedido
- **Situacao anterior:** exclusao direta de orcamento ignorava a protecao do cancelamento
  (FK `ON DELETE CASCADE` apagava pedidos em cascata, inclusive faturados); editar um orcamento
  ja aprovado (so "Salvar Alteracoes", sem nem mexer nos itens) quebrava silenciosamente o
  vinculo de qualquer pedido ja gerado, porque `atualizar_orcamento` sempre recriava todos os
  `orcamento_itens` do zero
- **Corrigido:** FK trocada pra `RESTRICT`; botao "Excluir" some da listagem quando aprovado/
  cancelado; `atualizar_orcamento` ignora o payload de itens quando ja existe pedido vinculado;
  tabela de itens vira somente-leitura na UI nesse caso
- **Testado end-to-end em producao**, inclusive tentativa de exclusao direta via API
  contornando a UI de proposito (bloqueada com HTTP 409) — detalhes em
  [docs/PEDIDOS.md](PEDIDOS.md) secoes 11 e 12

### Regra de negócio unificada: Cliente e Produto
Confirmado que Cliente segue a mesma regra que Produto no orçamento:
- Busca via combobox no catálogo (clientes / produtos)
- Se não encontrado: opção "Cadastrar como [cliente/produto]" ou "Usar só neste orçamento" (avulso)
- Se já vinculado e dados mudarem: ao salvar, pergunta se atualiza o cadastro
- Sem histórico de itens "rejeitados" - pergunta sempre de novo se o nome não bater

### Card de distribuição de status no Dashboard
- **Confirmado implementado** em `src/components/CardDistribuicaoStatus.tsx`, renderizado no
  Dashboard com dados reais (verificado em produção) — este item ficou "Em hold" no backlog
  bem depois de já ter sido codificado; documentação estava desatualizada, não o código

### Melhorias de UX pós-salvamento de orçamento
- **Confirmado implementado**: `NovoOrcamento.tsx` não usa mais `alert()` — mostra selo inline
  "✓ Orçamento salvo com sucesso". Backlog que estava desatualizado, código já estava pronto.
- **Atualizado em 2026-09-29**: a barra "Gerar PDF" / "+ Criar Novo" / "Ir para Listagem" pós-save
  foi removida — ver item "Rascunho automático de orçamento" abaixo, ela tinha um problema real
  (ficava sem nenhum botão de salvar pra continuar editando)

### Rascunho automático de orçamento + botão "Salvar" sumido após criar
- **Situacao anterior:** formulário só vivia em memória — fechar o navegador ou recarregar a
  página antes de salvar perdia tudo digitado (sem `localStorage`, sem autosave). Depois de
  salvar um orçamento novo, a página ficava presa em `/orcamentos/novo` sem nenhum botão de
  salvar pra continuar editando (só "Gerar PDF" / "Criar Novo" / "Ir para Listagem")
- **Corrigido:** rascunho automático em `localStorage` (debounced, com banner de restaurar/
  descartar, nunca restaura sozinho); ao salvar um orçamento novo, navega pra `/orcamentos/:id` e
  cai no fluxo de edição normal, que sempre tem "Salvar Alterações" disponível
- **Especificação completa, incluindo roadmap da Fase B (rascunho no banco):**
  [docs/RASCUNHO_LOCAL.md](RASCUNHO_LOCAL.md)
- **Testado end-to-end em produção** em 2026-09-29 (7 cenários, ver docs/RASCUNHO_LOCAL.md)
