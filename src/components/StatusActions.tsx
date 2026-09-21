import type { CSSProperties } from 'react'

type Status = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'expirado' | 'cancelado'

interface Props {
  status: Status
  desabilitado?: boolean
  onMudar: (novo: Status) => void
  onCancelar?: () => void
}

const STATUS_LABEL: Record<Status, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
}

const STATUS_COR: Record<Status, string> = {
  rascunho: 'var(--text2)',
  enviado: 'var(--blue)',
  aprovado: 'var(--green)',
  recusado: 'var(--red)',
  expirado: 'var(--amber)',
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

export default function StatusActions({ status, desabilitado, onMudar, onCancelar }: Props) {
  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className="text-[var(--text3)] text-xs uppercase tracking-wide">Status:</span>
      <span
        style={{
          color: STATUS_COR[status],
          fontWeight: 600,
          fontSize: '13px',
          marginRight: '6px',
        }}
      >
        {STATUS_LABEL[status]}
      </span>

      {/* Acoes conforme o status atual (fluxo do BACKLOG) */}
      {status === 'rascunho' && (
        <button type="button" disabled={desabilitado} style={botao('var(--blue)')} onClick={() => onMudar('enviado')}>
          Marcar como Enviado
        </button>
      )}

      {status === 'enviado' && (
        <>
          <button type="button" disabled={desabilitado} style={botao('var(--green)')} onClick={() => onMudar('aprovado')}>
            Marcar como Aprovado
          </button>
          <button type="button" disabled={desabilitado} style={botao('var(--red)')} onClick={() => onMudar('recusado')}>
            Marcar como Recusado
          </button>
        </>
      )}

      {status === 'expirado' && (
        <button type="button" disabled={desabilitado} style={botao('var(--blue)')} onClick={() => onMudar('enviado')}>
          Reenviar (voltar para Enviado)
        </button>
      )}

      {/* Aprovado pode ser cancelado (cascateia para os pedidos vinculados, ver docs/PEDIDOS.md) */}
      {status === 'aprovado' && onCancelar && (
        <button type="button" disabled={desabilitado} style={botao('var(--red)')} onClick={onCancelar}>
          Cancelar Orçamento
        </button>
      )}

      {/* Reversao discreta para Rascunho, disponivel em qualquer status != rascunho/cancelado */}
      {status !== 'rascunho' && status !== 'cancelado' && (
        <button type="button" disabled={desabilitado} style={botao('', true)} onClick={() => onMudar('rascunho')}>
          Reverter para Rascunho
        </button>
      )}
    </div>
  )
}
