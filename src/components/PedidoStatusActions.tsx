import type { CSSProperties } from 'react'
import type { StatusPedido } from '../hooks/usePedidos'

interface Props {
  status: StatusPedido
  desabilitado?: boolean
  onEntregue: () => void
  onFaturar: () => void
  onCancelar: () => void
}

const STATUS_LABEL: Record<StatusPedido, string> = {
  em_execucao: 'Em Execução',
  entregue: 'Entregue',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
}

const STATUS_COR: Record<StatusPedido, string> = {
  em_execucao: 'var(--blue)',
  entregue: 'var(--green)',
  faturado: 'var(--purple, #a855f7)',
  cancelado: 'var(--red)',
}

function botao(cor: string, contorno = false): CSSProperties {
  return {
    fontSize: '12px',
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: '7px',
    cursor: 'pointer',
    border: contorno ? '1px solid var(--text3)' : 'none',
    background: contorno ? 'transparent' : cor,
    color: contorno ? 'var(--text)' : '#fff',
    whiteSpace: 'nowrap',
  }
}

// Espelha StatusActions.tsx (fluxo do orcamento), com a maquina de estados do pedido:
// Em Execucao -> Entregue -> Faturado (terminal, nunca cancelavel). Cancelado disponivel
// em Em Execucao e Entregue.
export default function PedidoStatusActions({ status, desabilitado, onEntregue, onFaturar, onCancelar }: Props) {
  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className="text-[var(--text3)] text-xs uppercase tracking-wide">Status:</span>
      <span style={{ color: STATUS_COR[status], fontWeight: 600, fontSize: '13px', marginRight: '6px' }}>
        {STATUS_LABEL[status]}
      </span>

      {status === 'em_execucao' && (
        <>
          <button type="button" disabled={desabilitado} style={botao('var(--green)')} onClick={onEntregue}>
            Marcar como Entregue
          </button>
          <button type="button" disabled={desabilitado} style={botao('', true)} onClick={onCancelar}>
            Cancelar Pedido
          </button>
        </>
      )}

      {status === 'entregue' && (
        <>
          <button type="button" disabled={desabilitado} style={botao('var(--purple, #a855f7)')} onClick={onFaturar}>
            Marcar como Faturado
          </button>
          <button type="button" disabled={desabilitado} style={botao('', true)} onClick={onCancelar}>
            Cancelar Pedido
          </button>
        </>
      )}

      {/* faturado e cancelado sao terminais: nenhuma acao disponivel */}
    </div>
  )
}
