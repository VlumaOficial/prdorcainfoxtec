import type { CSSProperties } from 'react'
import { fmtBR } from '../lib/numeros'
import { calcularTotais } from '../lib/calculo'
import type { ItemOrcamento } from '../hooks/useItensOrcamento'
import type { ConfigGlobal } from '../hooks/useConfigGlobal'

interface Props {
  itens: ItemOrcamento[]
  config: ConfigGlobal
}

const blockStyle: CSSProperties = {
  background: 'var(--navy3)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '.875rem',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '7px 0',
  borderBottom: '1px solid var(--border)',
}

const lblStyle: CSSProperties = { fontSize: '12px', color: 'var(--text2)' }
const valStyle: CSSProperties = { fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '12px' }

export default function ResumoSidebar({ itens, config }: Props) {
  const t = calcularTotais(itens, config)
  const temCusto = t.tCusto > 0

  // Cor do lucro: verde se positivo, vermelho se negativo, neutro se zero
  let lucroCor = 'var(--text)'
  let lucroTexto = '—'
  if (temCusto) {
    if (t.tLuc > 0.005) {
      lucroCor = 'var(--amber)'
      lucroTexto = fmtBR(t.tLuc)
    } else if (t.tLuc < -0.005) {
      lucroCor = 'var(--red)'
      lucroTexto = '- ' + fmtBR(Math.abs(t.tLuc))
    } else {
      lucroTexto = fmtBR(0)
    }
  }

  // Box de resultado
  let boxBg = 'var(--navy4)'
  let boxBorda = 'var(--border2)'
  let resCor = 'var(--text2)'
  let resTexto = '—'
  let msgTexto = ''
  if (temCusto) {
    if (t.tLuc > 0.009) {
      boxBg = 'var(--green-dim)'
      boxBorda = 'var(--green)'
      resCor = 'var(--green)'
      resTexto = fmtBR(t.tLuc)
      const pct = t.tCusto > 0 ? ((t.tLuc / t.tCusto) * 100).toFixed(1) : '0.0'
      msgTexto = 'Lucro real de ' + pct + '% sobre os custos'
    } else if (t.tLuc < -0.009) {
      boxBg = 'var(--red-dim)'
      boxBorda = 'var(--red)'
      resCor = 'var(--red)'
      resTexto = '- ' + fmtBR(Math.abs(t.tLuc))
      msgTexto = 'Prejuizo — valor abaixo do piso'
    } else {
      resTexto = fmtBR(0)
      msgTexto = 'Empate — zero lucro e zero prejuizo'
    }
  }

  return (
    <div>
      <h2 className="text-[var(--text3)] text-[10px] font-bold uppercase tracking-widest mb-3">
        Resumo
      </h2>

      <div style={blockStyle}>
        <div style={rowStyle}>
          <span style={lblStyle}>Total de custos</span>
          <span style={valStyle}>{temCusto ? fmtBR(t.tCusto) : '—'}</span>
        </div>
        <div style={rowStyle}>
          <span style={lblStyle}>Lucro total</span>
          <span style={{ ...valStyle, color: lucroCor }}>{lucroTexto}</span>
        </div>
        <div style={rowStyle}>
          <span style={lblStyle}>Imposto total</span>
          <span style={{ ...valStyle, color: 'var(--red)' }}>{temCusto ? fmtBR(t.tImp) : '—'}</span>
        </div>
        {t.tDesc > 0.005 && (
          <div style={rowStyle}>
            <span style={lblStyle}>Desconto</span>
            <span style={{ ...valStyle, color: 'var(--purple)' }}>{'- ' + fmtBR(t.tDesc)}</span>
          </div>
        )}
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={lblStyle}>Piso sem prejuizo</span>
          <span style={{ ...valStyle, color: 'var(--green)' }}>{t.tPiso > 0 ? fmtBR(t.tPiso) : '—'}</span>
        </div>
      </div>

      {/* Box de resultado */}
      <div
        style={{
          marginTop: '8px',
          background: boxBg,
          border: '1px solid ' + boxBorda,
          borderRadius: '14px',
          padding: '.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text2)' }}>Resultado</span>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '16px', color: resCor }}>{resTexto}</span>
      </div>
      {msgTexto && (
        <p className="text-[11px] mt-2" style={{ color: 'var(--text3)' }}>{msgTexto}</p>
      )}
    </div>
  )
}
