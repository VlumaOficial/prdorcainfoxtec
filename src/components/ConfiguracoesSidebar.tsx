import type { CSSProperties } from 'react'
import { clamp99 } from '../lib/numeros'
import type { ConfigGlobal } from '../hooks/useConfigGlobal'

interface Props {
  config: ConfigGlobal
  onAtualizar: <K extends keyof ConfigGlobal>(campo: K, valor: ConfigGlobal[K]) => void
}

const numStyle: CSSProperties = {
  width: '58px',
  background: 'var(--navy4)',
  border: '1px solid var(--border2)',
  borderRadius: '6px',
  color: 'var(--text)',
  fontFamily: 'var(--mono)',
  fontSize: '13px',
  padding: '5px 6px',
  textAlign: 'right',
  outline: 'none',
}

const spinStyle: CSSProperties = {
  width: '22px',
  height: '28px',
  borderRadius: '5px',
  border: '1px solid var(--border2)',
  background: 'var(--navy4)',
  color: 'var(--text2)',
  cursor: 'pointer',
  fontSize: '15px',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  flexShrink: 0,
}

function Spinner({
  valor,
  onChange,
}: {
  valor: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        style={spinStyle}
        className="hover:border-[var(--green)] hover:text-[var(--green)]"
        onClick={() => onChange(clamp99(valor - 1))}
      >
        -
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={valor || ''}
        placeholder="0"
        onChange={(e) => onChange(clamp99(parseFloat(e.target.value) || 0))}
        style={numStyle}
        className="focus:border-[var(--green)]"
      />
      <button
        type="button"
        style={spinStyle}
        className="hover:border-[var(--green)] hover:text-[var(--green)]"
        onClick={() => onChange(clamp99(valor + 1))}
      >
        +
      </button>
    </div>
  )
}

function TogglePdf({
  ativo,
  onToggle,
}: {
  ativo: boolean
  onToggle: () => void
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-[var(--text3)] uppercase tracking-wide select-none">
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
      PDF
    </label>
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
}

export default function ConfiguracoesSidebar({ config, onAtualizar }: Props) {
  return (
    <div>
      <h2 className="text-[var(--text3)] text-[10px] font-bold uppercase tracking-widest mb-3">
        Configurações
      </h2>

      <div style={blockStyle}>
        {/* Imposto */}
        <div style={{ ...rowStyle, borderBottom: '1px solid var(--border)' }}>
          <span className="text-[12px] text-[var(--text2)] flex-1">Imposto (%)</span>
          <div className="flex items-center gap-2">
            <Spinner valor={config.impPct} onChange={(v) => onAtualizar('impPct', v)} />
            <TogglePdf ativo={config.impNoPdf} onToggle={() => onAtualizar('impNoPdf', !config.impNoPdf)} />
          </div>
        </div>

        {/* Margem (sem toggle PDF) */}
        <div style={{ ...rowStyle, borderBottom: '1px solid var(--border)' }}>
          <span className="text-[12px] text-[var(--text2)] flex-1">Margem (%)</span>
          <Spinner valor={config.margPct} onChange={(v) => onAtualizar('margPct', v)} />
        </div>

        {/* Desconto */}
        <div style={rowStyle}>
          <span className="text-[12px] text-[var(--text2)] flex-1">Desconto (%)</span>
          <div className="flex items-center gap-2">
            <Spinner valor={config.descPct} onChange={(v) => onAtualizar('descPct', v)} />
            <TogglePdf ativo={config.descNoPdf} onToggle={() => onAtualizar('descNoPdf', !config.descNoPdf)} />
          </div>
        </div>
      </div>
    </div>
  )
}
