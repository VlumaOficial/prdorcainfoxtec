# Rascunho automático de orçamento

Status: **Fase A implementada e testada em produção** (2026-09-29). Fase B documentada abaixo,
não implementada.

## Problema

O formulário de orçamento (`src/pages/NovoOrcamento.tsx`) vive inteiramente em memória (estado do
React) até o clique explícito em "Salvar". Fechar o navegador, reiniciar a máquina ou navegar
para outra página antes de salvar perdia tudo o que foi digitado — confirmado ao vivo em
produção antes de qualquer correção.

Um segundo problema relacionado, corrigido junto: depois de salvar um orçamento novo, a página
ficava presa em `/orcamentos/novo` sem nenhum botão de salvar pra continuar editando (só
"Gerar PDF" / "Criar Novo" / "Ir para Listagem"). Corrigido navegando para `/orcamentos/:id`
assim que a criação é confirmada, caindo no fluxo de edição normal (que sempre tem "Salvar
Alterações" disponível).

## Fase A — rascunho no `localStorage` (implementada)

Hook: [`src/hooks/useRascunhoLocal.ts`](../src/hooks/useRascunhoLocal.ts). Componente do banner:
[`src/components/BannerRascunho.tsx`](../src/components/BannerRascunho.tsx). Wiring completo em
`NovoOrcamento.tsx`.

### Mecanismo

- **Chave por contexto**: `orcamento_rascunho_novo` para `/orcamentos/novo`;
  `orcamento_rascunho_editar_<id>` para `/orcamentos/:id`. O mesmo hook cobre os dois casos —
  perder edições não salvas é o mesmo risco tanto criando quanto editando um orçamento existente.
- **Escrita debounced** (~1.5s após a última mudança) de um snapshot completo do formulário
  (cabeçalho, cliente vinculado/avulso, itens, configurações) em `localStorage`, dentro de
  try/catch — nunca deixa `localStorage` indisponível (modo privado, quota estourada) quebrar o
  formulário.
- **Schema versionado** (`versao: 1`): se uma versão futura do schema mudar o formato, a leitura
  descarta rascunhos de versão desconhecida em vez de tentar migrá-los. Rascunho é rede de
  segurança efêmera, não dado crítico — simplicidade > compatibilidade retroativa aqui.
- **Nunca restaura automaticamente**: ao detectar um rascunho ao abrir a página, mostra um banner
  ("Encontramos um rascunho não salvo de [data/hora]. Restaurar / Descartar") e espera a decisão
  do usuário. Evita sobrescrever silenciosamente um começo novo com lixo antigo.
- **Restaurar reaproveita o mecanismo de carregamento já existente**: os mesmos `carregar()`
  expostos por `useNovoOrcamento`, `useItensOrcamento` e `useConfigGlobal` — usados hoje para
  popular o formulário a partir do banco — são chamados com os dados do rascunho. Zero lógica de
  restauração nova.
- **Limpo automaticamente** após um salvamento bem-sucedido (a linha do banco vira a fonte de
  verdade, não precisa mais da rede de segurança local).

### Limitação conhecida (aceita para a Fase A)

O rascunho fica preso ao navegador/computador onde foi digitado — não aparece se o usuário abrir
o mesmo orçamento de outro dispositivo. Resolvido na Fase B.

## Testes end-to-end realizados (2026-09-29)

Testado com Playwright direto em produção, login real, após o deploy:

| Cenário | Resultado |
|---|---|
| Preencher `/orcamentos/novo` sem salvar, recarregar → banner "Encontramos um rascunho não salvo de [data/hora]" aparece | OK |
| Clicar "Restaurar" → cliente, título e item voltam exatamente como estavam | OK |
| Salvar o orçamento restaurado → URL vira `/orcamentos/:id`, `StatusActions` aparece,
  botão "Salvar Alterações" disponível (o botão que antes sumia) | OK |
| Editar de novo **sem sair da página** e clicar "Salvar Alterações" → salva normalmente,
  sem precisar voltar pra listagem e reabrir | OK |
| Rascunho é limpo após salvar — reload seguinte não mostra mais o banner | OK |
| Preencher, aguardar autosave, recarregar, clicar "Descartar" → banner some e não
  reaparece em um novo reload | OK |
| Editar um orçamento **existente** (`/orcamentos/:id`), mudar observações sem salvar,
  recarregar → o mesmo banner de rascunho aparece também nesse contexto | OK |

## Fase B — rascunho real no banco (não implementada, roteiro documentado)

Evolução natural, não uma substituição: o `localStorage` passa a ser o **cache rápido/offline**
sobre uma linha real na tabela `orcamentos`, em vez de ser a única cópia.

### Como se encaixaria no que já existe

- O schema `RascunhoOrcamentoV1` já reserva o campo `orcamentoIdBanco: string | null` — na Fase A
  sempre `null`; na Fase B, passaria a apontar pra linha `rascunho` no banco depois do primeiro
  upsert automático.
- Fluxo: depois do primeiro `agendarSalvar` bem-sucedido no localStorage, dispara (também
  debounced, intervalo maior, ex. 15-30s) um upsert real — `salvar_orcamento` na primeira vez,
  `atualizar_orcamento` nas seguintes — e grava o `id` retornado em `orcamentoIdBanco`.
- **Precedência na restauração**: se `orcamentoIdBanco` existe e o registro é alcançável no banco,
  ele vence (fonte de verdade, sobrevive a troca de dispositivo); o snapshot local em
  `dados` vira só o buffer usado quando offline ou antes do primeiro sync bem-sucedido.

### Decisão de produto ainda em aberto (resolver antes de implementar a Fase B)

Como diferenciar um **rascunho automático ainda sendo digitado** (pode ser abandonado a
qualquer momento) de um **rascunho que o usuário salvou de propósito** e pausou pra continuar
depois? Sem resolver isso, um rascunho automático abandonado ficaria poluindo a listagem de
Orçamentos e consumindo numeração (`sugerir_numero_orcamento`) à toa. Alternativas a avaliar
quando a Fase B entrar em pauta:
- Marcar a origem (`origem = 'rascunho_automatico'` vs `'manual'`) e filtrar/ocultar automáticos
  vazios da listagem.
- Rotina de limpeza periódica de rascunhos automáticos vazios/abandonados há mais de N dias.

## Arquivos

- `src/hooks/useRascunhoLocal.ts` — hook genérico (Fase A completa, schema pronto pra Fase B)
- `src/components/BannerRascunho.tsx` — UI de oferta de restauração
- `src/pages/NovoOrcamento.tsx` — wiring: verificação ao montar, rastreio debounced, limpeza pós-save
