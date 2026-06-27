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
