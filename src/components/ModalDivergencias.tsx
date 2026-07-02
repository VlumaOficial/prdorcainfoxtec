import type { Divergencia } from '../lib/detectarDivergencias'

interface Props {
  divergencias: Divergencia[]
  onAtualizarCatalogo: () => void
  onSoNesteOrcamento: () => void
  onCancelar: () => void
  processando?: boolean
}

export default function ModalDivergencias({
  divergencias,
  onAtualizarCatalogo,
  onSoNesteOrcamento,
  onCancelar,
  processando,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onCancelar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--navy2)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <h2 style={{ color: 'var(--text)', fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
          Atualizar cadastros no catalogo?
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '18px' }}>
          Voce alterou dados que estao vinculados ao catalogo. Escolha se deseja atualizar os cadastros
          ou manter as alteracoes apenas neste orcamento.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {divergencias.map((d, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--navy3)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                    color: d.tipo === 'produto' ? 'var(--green)' : 'var(--blue)',
                    background: d.tipo === 'produto' ? 'var(--green-dim)' : 'rgba(59,130,246,.12)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {d.tipo === 'produto' ? 'Produto' : 'Cliente'}
                </span>
                <span style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 600 }}>{d.nome}</span>
              </div>
              <div className="flex flex-col gap-1">
                {d.mudancas.map((m, i) => (
                  <div key={i} style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--text3)' }}>{m.campo}: </span>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text3)' }}>{m.de}</span>
                    <span style={{ color: 'var(--text3)' }}> {'\u2192'} </span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{m.para}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onAtualizarCatalogo}
            disabled={processando}
            style={{
              flex: 1,
              background: 'var(--green)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: processando ? 'not-allowed' : 'pointer',
              opacity: processando ? 0.6 : 1,
            }}
          >
            {processando ? 'Salvando...' : 'Sim, atualizar catalogo'}
          </button>
          <button
            type="button"
            onClick={onSoNesteOrcamento}
            disabled={processando}
            style={{
              flex: 1,
              background: 'transparent',
              color: 'var(--text)',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border2)',
              cursor: processando ? 'not-allowed' : 'pointer',
              opacity: processando ? 0.6 : 1,
            }}
          >
            Nao, so neste orcamento
          </button>
        </div>
        <button
          type="button"
          onClick={onCancelar}
          disabled={processando}
          style={{
            width: '100%',
            marginTop: '10px',
            background: 'transparent',
            color: 'var(--text3)',
            fontSize: '13px',
            padding: '6px',
            border: 'none',
            cursor: processando ? 'not-allowed' : 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
