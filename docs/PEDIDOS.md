# Especificação — Módulo de Pedidos

Status: **implementado, migration aplicada em produção, testado end-to-end na URL pública
(orcamento.infoxtec.com.br) em 2026-09-21** — ver seção 11 para o relatório de testes.
Origem: decisão de produto entre PO, UX e Engenharia (registrada aqui antes de codificar).
Plano de implementação: `/home/sdorea/.claude/plans/happy-prancing-eich.md`.

## 1. Objetivo

Quando um orçamento é aprovado, o sistema deve gerar um ou mais **Pedidos** vinculados a ele,
representando a fase de execução/entrega/faturamento — separada da fase comercial (cotação),
que continua vivendo em `orcamentos`.

Motivação de separar em vez de estender o status do orçamento: o orçamento é um documento
comercial (pode ser comparado, tem taxa de conversão, é reaprovável); o pedido é operacional
(tem prazo de entrega, SLA, dado fiscal). Misturar os dois numa única máquina de estados
impediria, por exemplo, entrega parcial de um mesmo orçamento aprovado.

## 2. Decisão de arquitetura

**Duas entidades vinculadas, relação 1:N** (`orcamentos` 1 → N `pedidos`), não uma extensão do
status do orçamento. Um orçamento aprovado pode gerar múltiplos pedidos parciais, cada um
carregando um subconjunto dos itens do orçamento.

## 3. Modelo de dados

### `pedidos`

| campo | tipo | observação |
|---|---|---|
| `id` | uuid | PK |
| `empresa_id` | uuid | FK `empresas`, RLS igual ao resto do sistema |
| `orcamento_id` | uuid | FK `orcamentos`, **sem** unique — 1 orçamento pode ter N pedidos |
| `numero` | text | ver seção 5 (numeração) |
| `status` | text | `em_execucao` \| `entregue` \| `faturado` \| `cancelado` |
| `data_criacao` | timestamptz | default `now()` |
| `data_entrega` | date | preenchida na transição para Entregue |
| `data_faturamento` | date | preenchida na transição para Faturado |
| `numero_nf` | text | preenchido no modal de faturamento |
| `serie_nf` | text | preenchido no modal de faturamento |
| `valor_faturado` | numeric(12,2) | preenchido no modal de faturamento |
| `chave_acesso_nf` | text | opcional/avançado, não obrigatório no modal |
| `observacoes` | text | livre |
| `created_at` / `updated_at` | timestamptz | padrão do projeto (`set_updated_at()`) |

### `pedido_itens`

| campo | tipo | observação |
|---|---|---|
| `id` | uuid | PK |
| `pedido_id` | uuid | FK `pedidos` |
| `orcamento_item_id` | uuid | FK `orcamento_itens.id` |

Não duplica descrição/valor/qtd — sempre exibido via join com `orcamento_itens`, que já é o
snapshot imutável definido no momento da aprovação. Isso evita divergência entre pedido e
orçamento (mesmo problema que o projeto já evita hoje ao fazer snapshot de `cliente_nome`,
`cliente_cnpj` etc. direto em `orcamentos`).

**Vínculo é por item inteiro, não por quantidade fracionada.** Se um item precisar ser
parcialmente entregue (metade agora, metade depois), ele deve ter sido lançado como dois itens
separados no orçamento — fracionar quantidade dentro de um único item vinculado é complexidade
que não resolvemos agora (ver seção 8).

### Exclusividade item → pedido

Regra: um `orcamento_item_id` só pode estar vinculado a **um pedido não-cancelado** por vez.

Implementação: validação dentro do RPC de criação do pedido (verifica se o item já aparece em
`pedido_itens` de algum pedido com status diferente de `cancelado`), no mesmo padrão de
`salvar_orcamento`/`atualizar_orcamento` — não um constraint de banco exótico.

### Status novo em `orcamentos`

Adicionar `cancelado` ao enum de status de orçamento (hoje: `rascunho`, `enviado`, `aprovado`,
`recusado`, `expirado`). `recusado` continua existindo e significa "cliente recusou a proposta
antes de qualquer pedido existir" — semântica diferente de `cancelado`, que é o resultado do
fluxo de cancelamento pós-aprovação descrito abaixo.

## 4. Máquina de estados

### Orçamento
```
rascunho → enviado → aprovado → cancelado
              ↓
           recusado
              ↓ (automático, por data)
           expirado
```

### Pedido
```
em_execucao → entregue → faturado   (faturado é terminal, não pode ser cancelado)
     ↓             ↓
        cancelado
```

## 5. Numeração

O pedido reaproveita o número do orçamento, trocando o prefixo `ORC-` por `PED-` e sempre
acrescentando um sufixo sequencial de 2 dígitos — desde o primeiro pedido, para manter
consistência visual mesmo quando não há parcial:

```
ORC-2026-049  →  PED-2026-049-01
              →  PED-2026-049-02  (se houver um segundo pedido parcial)
```

## 6. Regra de cancelamento em cascata (bidirecional, ajustada para múltiplos pedidos)

A regra original ("cancelar um cancela o outro") só funciona 1:1. Com múltiplos pedidos por
orçamento, foi ajustada:

**Pedido → Orçamento**: cancelar um pedido só cancela o orçamento vinculado se esse pedido era o
**único ativo/faturado** — ou seja, todos os demais pedidos daquele orçamento já estão
cancelados. Caso contrário, o orçamento permanece `aprovado` e os itens do pedido cancelado
voltam para o pool de itens sem pedido, disponíveis para um novo pedido.

**Orçamento → Pedido**: cancelar o orçamento cancela todos os pedidos vinculados que ainda não
estão `faturado`. Se existir pelo menos um pedido `faturado`, o cancelamento do orçamento é
**bloqueado** com mensagem explícita (ex.: "não é possível cancelar — pedido PED-2026-049-02 já
foi faturado").

**Faturado nunca é cancelável**, em nenhuma direção (regra confirmada pelo PO).

Implementação: dois RPCs diretos (`cancelar_orcamento(p_id)`, `cancelar_pedido(p_id)`), cada um
checando status atual antes de propagar — evita loop infinito sem precisar de flag de
recursão, porque são chamadas diretas e idempotentes, não triggers reagindo um ao outro.

## 7. Fluxos

### Aprovação → criação do primeiro pedido
Ao mudar o orçamento para `aprovado`, abre automaticamente a tela **"Gerar Pedido"** com todos
os itens ainda não vinculados pré-marcados (na primeira vez, todos os itens do orçamento). Caso
comum: usuário confirma direto, um clique, pedido sai com tudo. Caso parcial: usuário desmarca
os itens que só serão entregues depois — eles ficam disponíveis para um pedido futuro.

### Pedido parcial adicional
Enquanto existirem itens do orçamento sem vínculo a nenhum pedido ativo, a tela do orçamento
mostra o botão **"Novo Pedido (itens restantes)"**, abrindo a mesma tela de seleção de itens.

### Faturamento
Ao mover um pedido para `faturado`, abre modal solicitando: **número da nota fiscal, série,
data de emissão, valor faturado**. Chave de acesso (44 dígitos) fica como campo opcional —
preparado para uma futura integração real de emissão de NF-e, mas não obrigatório hoje.

## 8. UX

- Novo item de menu **"Pedidos"**, nível superior, ao lado de Orçamentos/Clientes/Produtos.
- Tela de listagem de Pedidos espelha a de Orçamentos (busca, filtro por status).
- Detalhe do pedido é somente leitura para itens/valores (vêm do orçamento de origem) — editável
  apenas o que é do próprio pedido: status, datas, dados fiscais, observações.
- Cores de status do pedido, distintas das do orçamento para não confundir as duas telas:
  - Em Execução = azul
  - Entregue = verde
  - Faturado = roxo (indica "fechado/dinheiro recebido")
  - Cancelado = vermelho
- Avisos de cascata sempre explícitos na UI antes de confirmar cancelamento, nos dois sentidos
  (ex.: "Isso também cancelará o pedido PED-2026-049-01 vinculado. Continuar?").
- PDF do pedido reaproveita o gerador de PDF existente ([src/lib/gerarPdf.ts](../src/lib/gerarPdf.ts)),
  trocando o rótulo "ORÇAMENTO" por "PEDIDO" no cabeçalho e o prefixo do arquivo salvo
  (`pedido-PED-...pdf`).
- Painel **"Configurações do PDF"** na tela do Pedido
  ([src/components/ConfiguracoesSidebarPedido.tsx](../src/components/ConfiguracoesSidebarPedido.tsx)),
  espelhando os mesmos 5 toggles que já existem no orçamento (Imposto/Desconto/Quantidade/Valor
  Unitário/Total por item no PDF) — sem os spinners de %, já que o pedido herda os percentuais do
  orçamento aprovado e não deve permitir editá-los. Igual ao orçamento hoje, a escolha **não é
  persistida no banco**, é só estado da sessão do formulário (reseta ao reabrir o pedido).
- Dashboard atual continua olhando só para orçamentos (KPIs comerciais); KPIs de pedidos
  (em execução, entregues no mês, valor faturado no mês) ficam numa seção própria, sem misturar
  taxa de conversão de proposta com métricas de entrega/faturamento.

## 9. Fora de escopo (por ora)

- Fracionamento de quantidade dentro de um único item entre dois pedidos (contorno atual: lançar
  como itens separados no orçamento).
- Integração real de emissão de NF-e — o modal de faturamento hoje só registra dados informados
  manualmente.
- Múltiplas notas fiscais por pedido (1 pedido = 1 registro de faturamento).

## 10. Perguntas ainda em aberto

- Quando um pedido é cancelado e libera itens de volta ao pool, deve haver algum registro
  histórico visível de que aquele item já passou por um pedido cancelado antes? (Auditoria /
  rastreabilidade, não definido ainda.)

## 11. Testes end-to-end realizados (2026-09-21)

Testado com Playwright direto na URL pública (`orcamento.infoxtec.com.br`), login real, após a
migration aplicada e o deploy em produção via Vercel. Dois orçamentos de teste foram criados e
depois removidos (ver `supabase/limpeza_teste_pedidos.sql`).

| Cenário | Resultado |
|---|---|
| Login + navegação (item "Pedidos" no menu, sidebar colapsa igual à de Orçamentos) | OK |
| Criar orçamento → Enviado → Aprovado | OK |
| Aprovar abre a tela "Gerar Pedido" automaticamente, com o(s) item(ns) pré-marcado(s) | OK |
| Gerar pedido com todos os itens (caso comum) — numeração `PED-2026-054-01` | OK |
| Marcar pedido como Entregue → Faturado, com o modal pedindo NF/série/valor | OK |
| Dados fiscais gravados e exibidos na tela do pedido faturado | OK |
| **Cancelar orçamento com pedido já faturado vinculado → bloqueado** com a mensagem "Não é
  possível cancelar: existe pedido já faturado vinculado a este orçamento." | OK |
| Listagem de Pedidos (join com orçamento, número, cliente, valor faturado, status) | OK |
| Orçamento com 2 itens → gerar pedido só com 1 item (parcial) | OK — `PED-2026-055-01` |
| Botão "Novo Pedido (itens restantes)" aparece só com item pendente, some depois | OK |
| Segunda seleção de itens mostra **somente** o item ainda não vinculado (exclusividade
  item→pedido funcionando corretamente) | OK — `PED-2026-055-02` |
| Painel "Configurações do PDF" no pedido: toggles começam desligados, alternam e o PDF sai
  com o nome `pedido-PED-....pdf` (prefixo correto, distinto de `orcamento-...pdf`) | OK |
| **Cascata de cancelamento — caso parcial**: cancelar 1 de 2 pedidos ativos do mesmo
  orçamento NÃO cancela o orçamento (o outro pedido continua ativo) | OK |
| **Cascata de cancelamento — último pedido**: cancelar o último pedido ativo/não-cancelado
  cancela o orçamento junto | OK |
| Isolamento multi-tenant nas RPCs novas (`criar_pedido`, `cancelar_pedido`,
  `cancelar_orcamento`, `itens_disponiveis_orcamento`) | Corrigido antes do deploy — ver seção 12 |

Não testado ainda: geração de PDF do orçamento com o painel de config recém-generalizado (só do
pedido), e o cenário de reverter um pedido cancelado (não existe essa ação hoje, é intencional).

### Rodada extra (2026-09-21): correções de integridade orçamento↔pedido

Testado após aplicar `20260921130909_protecao_orcamento_pedido.sql` em produção:

| Cenário | Resultado |
|---|---|
| Orçamento aprovado com pedido vinculado → tabela de itens fica somente-leitura na UI, com
  aviso "Itens travados — este orçamento já gerou pedido(s)" e sem botão "Adicionar item" | OK |
| Editar só a "Observações gerais" desse orçamento e clicar "Salvar Alterações" → o pedido
  já gerado **continua mostrando o item normalmente** (antes da correção, o item sumiria do
  pedido por causa do `ON DELETE CASCADE` disparado pelo delete-e-recria de `orcamento_itens`) | OK |
| Listagem de Orçamentos → botão "Excluir" não aparece mais para orçamento com status
  `aprovado` | OK |
| **Tentativa de exclusão direta via API** (`DELETE .../rest/v1/orcamentos?id=eq....`,
  contornando a UI de propósito, com o token de uma sessão autenticada real) → banco recusa
  com HTTP 409 / `23503 foreign_key_violation`, mesmo passando pela UI | OK |

## 12. Riscos conhecidos / pendências

### ~~Exclusão direta de orçamento ignora a proteção do cancelamento~~ — corrigido em 2026-09-21

Descoberto ao gerar o script de limpeza dos dados de teste: a função `excluir()` em
`useOrcamentos.ts` fazia um `DELETE` direto na tabela `orcamentos`, sem nenhuma regra de negócio.
Como `pedidos_orcamento_id_fkey` estava como `ON DELETE CASCADE`, excluir um orçamento **apagava
silenciosamente qualquer pedido vinculado — inclusive um já Faturado**, contornando por completo
a proteção construída para o cancelamento (seção 6).

Corrigido em `20260921130909_protecao_orcamento_pedido.sql`:
1. FK trocada de `CASCADE` para `RESTRICT` — o banco recusa a exclusão no nível de dados
   enquanto existir qualquer pedido vinculado, mesmo por acesso direto (testado via API direta,
   contornando a UI de propósito — ver seção 11).
2. Botão "Excluir" escondido na listagem de Orçamentos quando o status é `aprovado` ou
   `cancelado`. Rascunho/Enviado/Recusado/Expirado nunca geraram pedido, continuam podendo ser
   excluídos normalmente.

### ~~Edição de orçamento quebra itens de pedido já gerado~~ — corrigido em 2026-09-21

`atualizar_orcamento` sempre apagava e recriava **todos** os `orcamento_itens` a cada "Salvar
Alterações" — como `pedido_itens.orcamento_item_id` tem `ON DELETE CASCADE`, isso quebrava
silenciosamente o vínculo de qualquer pedido já gerado, mesmo editando só a observação, sem
tocar nos itens.

Corrigido na mesma migration, em duas camadas:
1. **RPC**: se existir qualquer pedido vinculado ao orçamento (qualquer status), `atualizar_orcamento`
   ignora o payload de itens e não toca em `orcamento_itens` — só atualiza o cabeçalho.
2. **UI**: a tabela de itens em `NovoOrcamento.tsx` vira somente-leitura nesse caso (sem
   adicionar/remover/editar), com aviso explicando o motivo. Escape hatch: cancelar o orçamento
   e criar um novo, se for realmente necessário mudar os itens.

### Correção de segurança aplicada durante a implementação

As 4 RPCs novas são `SECURITY DEFINER` (necessário para bypassar RLS e fazer as validações
cruzadas entre tabelas). Na primeira versão da migration, nenhuma delas verificava se o
orçamento/pedido pertencia à empresa de quem estava chamando — como RLS não se aplica dentro de
`SECURITY DEFINER`, isso permitiria a um usuário autenticado de uma empresa cancelar ou gerar
pedido em orçamento de outra empresa. Corrigido antes do deploy: todas as 4 funções agora
verificam `empresa_id = (select empresa_id from get_meu_perfil())` antes de qualquer operação.
