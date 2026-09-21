import type { CSSProperties } from 'react'
import type { ConfigGlobal } from '../hooks/useConfigGlobal'

interface Props {
  config: ConfigGlobal
  onAtualizar: <K extends keyof ConfigGlobal>(campo: K, valor: ConfigGlobal[K]) => void
}

function TogglePdf({ ativo, onToggle }: { ativo: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={ativo}
      style={{
        width: '32px',
        height: '18px',
        borderRadius: '9px',
        background: ativo ? 'var(--green)' : 'var(--navy4)',
        border: '1px solid var(--border2)',
        position: 'relative',
        transition: 'background .15s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '1px',
          left: ativo ? '15px' : '2px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
        }}
      />
    </button>
  )
}

const blockStyle: CSSProperties = {
  background: 'var(--navy3)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '.875rem',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '8px 0',
  borderBottom: '1px solid var(--border)',
}

// Versao reduzida do ConfiguracoesSidebar (so os toggles de coluna do PDF, sem os
// spinners de Imposto/Margem/Desconto: o pedido herda os percentuais do orcamento
// aprovado e nao deve permitir edita-los). Igual ao orcamento, a escolha nao e
// persistida no banco - e so estado da sessao do formulario.
export default function ConfiguracoesSidebarPedido({ config, onAtualizar }: Props) {
  return (
    <div>
      <h2 className="text-[var(--text3)] text-[10px] font-bold uppercase tracking-widest mb-3">
        Configurações do PDF
      </h2>

      <div style={blockStyle}>
        <div style={rowStyle}>
          <span className="text-[12px] text-[var(--text2)] flex-1">Imposto no PDF</span>
          <TogglePdf ativo={config.impNoPdf} onToggle={() => onAtualizar('impNoPdf', !config.impNoPdf)} />
        </div>
        <div style={rowStyle}>
          <span className="text-[12px] text-[var(--text2)] flex-1">Desconto no PDF</span>
          <TogglePdf ativo={config.descNoPdf} onToggle={() => onAtualizar('descNoPdf', !config.descNoPdf)} />
        </div>
        <div style={rowStyle}>
          <span className="text-[12px] text-[var(--text2)] flex-1">Quantidade no PDF</span>
          <TogglePdf ativo={config.qtdPdf} onToggle={() => onAtualizar('qtdPdf', !config.qtdPdf)} />
        </div>
        <div style={rowStyle}>
          <span className="text-[12px] text-[var(--text2)] flex-1">Valor unitario no PDF</span>
          <TogglePdf ativo={config.valorUnitPdf} onToggle={() => onAtualizar('valorUnitPdf', !config.valorUnitPdf)} />
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span className="text-[12px] text-[var(--text2)] flex-1">Total por item no PDF</span>
          <TogglePdf ativo={config.totalLinhaPdf} onToggle={() => onAtualizar('totalLinhaPdf', !config.totalLinhaPdf)} />
        </div>
      </div>
    </div>
  )
}
