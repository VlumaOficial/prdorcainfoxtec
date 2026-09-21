# Backlog — Sistema de Orçamento Infoxtec

Itens identificados mas adiados deliberadamente, com a fase em que devem ser retomados.

## Em hold

### Card de distribuição de status no Dashboard
- **Quando retomar:** F6, depois da F5 (Gerar Orçamento) estar pronta
- **Motivo do hold:** sem orçamentos reais cadastrados, o card ficaria zerado e não validaria o design (largura 2 colunas, formato de barras, cores por status)
- **Decisões já tomadas:**
  - Status do orçamento: Rascunho, Enviado, Aprovado, Recusado, Expirado
  - Cores: Rascunho=cinza, Enviado=azul, Aprovado=verde, Recusado=vermelho, Expirado=âmbar
  - Card ocupa 2 colunas do grid (mais largo que os demais KPIs)
  - Transições: Rascunho→Enviado é manual; Enviado→Expirado é automático (calculado on-the-fly comparando validade com data atual, sem necessidade de cronjob); Enviado→Aprovado/Recusado é manual; qualquer status pode ser revertido manualmente
  - Botão "Gerar PDF" na tela de orçamento deve ficar próximo da ação de marcar como "Enviado", sem acoplamento automático obrigatório

## Concluído
(itens movidos para aqui conforme forem implementados)

## Concluído

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

## Em hold

### Melhorias de UX pós-salvamento de orçamento
- **Quando retomar:** depois da F5.6 completa (salvamento com auto-cadastro)
- **Motivo do hold:** finalizar toda a lógica de salvamento antes do polimento visual
- **Melhorias a fazer:**
  - Remover o `alert()` temporário de sucesso (feio, bloqueia tela) — substituir por toast discreto ou selo de estado
  - Após salvar, manter formulário preenchido (usuário pode querer gerar PDF) e trocar botão "Salvar" por estado "✓ Salvo" + botões "Criar Novo" (limpa e gera novo número) e "Gerar PDF" (quando o PDF existir)

### Endereco do cliente na tela de Clientes
- **Quando retomar:** refinamento futuro da tela de Clientes
- **Situacao:** o endereco cadastrado nao aparece na listagem de Clientes, so ao abrir a edicao
- **Baixa prioridade:** nao bloqueia o fluxo de orcamento
