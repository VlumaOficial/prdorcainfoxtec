import { useState } from 'react'
import type { CSSProperties } from 'react'
import { fmtBR, parseBR } from '../lib/numeros'
import type { DadosFaturamento } from '../hooks/useAcoesPedido'

interface Props {
  valorSugerido: number
  processando?: boolean
  onConfirmar: (dados: DadosFaturamento) => void
  onCancelar: () => void
}

const inputStyle: CSSProperties = {
  background: 'var(--navy3)',
  border: '1px solid var(--border2)',
  borderRadius: '8px',
  fontFamily: '"Inter", sans-serif',
  fontSize: '13px',
}

const labelStyle: CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.03em',
  color: 'var(--text3)',
}

// Modal de dados fiscais, aberto ao mover um pedido para "Faturado" (ponto 5 da especificacao
// em docs/PEDIDOS.md). Chave de acesso e opcional/avancada.
export default function ModalFaturamento({ valorSugerido, processando, onConfirmar, onCancelar }: Props) {
  const [numeroNf, setNumeroNf] = useState('')
  const [serieNf, setSerieNf] = useState('')
  const [valorTexto, setValorTexto] = useState(fmtBR(valorSugerido))
  const [chaveAcesso, setChaveAcesso] = useState('')

  const valido = numeroNf.trim().length > 0 && parseBR(valorTexto) > 0

  function handleConfirmar() {
    if (!valido) return
    onConfirmar({
      numeroNf: numeroNf.trim(),
      serieNf: serieNf.trim(),
      valorFaturado: parseBR(valorTexto),
      chaveAcessoNf: chaveAcesso.trim() || undefined,
    })
  }

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
          maxWidth: '440px',
          width: '100%',
          padding: '24px',
        }}
      >
        <h2 style={{ color: 'var(--text)', fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
          Dados fiscais do faturamento
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '18px' }}>
          Informe os dados da nota fiscal para marcar este pedido como faturado.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label style={labelStyle}>Numero da NF</label>
            <input
              type="text"
              value={numeroNf}
              onChange={(e) => setNumeroNf(e.target.value)}
              style={inputStyle}
              className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label style={labelStyle}>Serie</label>
            <input
              type="text"
              value={serieNf}
              onChange={(e) => setSerieNf(e.target.value)}
              style={inputStyle}
              className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-3">
          <label style={labelStyle}>Valor faturado</label>
          <input
            type="text"
            value={valorTexto}
            onChange={(e) => setValorTexto(e.target.value)}
            onFocus={(e) => e.target.select()}
            style={inputStyle}
            className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
          />
        </div>

        <div className="flex flex-col gap-1 mb-6">
          <label style={labelStyle}>Chave de acesso (opcional)</label>
          <input
            type="text"
            value={chaveAcesso}
            onChange={(e) => setChaveAcesso(e.target.value)}
            placeholder="44 digitos"
            style={inputStyle}
            className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={processando || !valido}
            style={{
              flex: 1,
              background: 'var(--green)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: processando || !valido ? 'not-allowed' : 'pointer',
              opacity: processando || !valido ? 0.6 : 1,
            }}
          >
            {processando ? 'Salvando...' : 'Confirmar Faturamento'}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={processando}
            style={{
              background: 'transparent',
              color: 'var(--text)',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border2)',
              cursor: processando ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
