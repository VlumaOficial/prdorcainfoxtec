# Especificação — Módulo de Pedidos

Status: **implementado no código, aguardando aplicação da migration no banco real**
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
  trocando o rótulo "ORÇAMENTO" por "PEDIDO" no cabeçalho.
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
