import type { DistribuicaoStatus } from '../hooks/useDistribuicaoStatus'

interface Props {
  distribuicao: DistribuicaoStatus | null
  carregando: boolean
}

const STATUS_INFO: { chave: keyof DistribuicaoStatus; label: string; cor: string }[] = [
  { chave: 'rascunho', label: 'Rascunho', cor: 'var(--text2)' },
  { chave: 'enviado', label: 'Enviado', cor: 'var(--blue)' },
  { chave: 'aprovado', label: 'Aprovado', cor: 'var(--green)' },
  { chave: 'recusado', label: 'Recusado', cor: 'var(--red)' },
  { chave: 'expirado', label: 'Expirado', cor: 'var(--amber)' },
]

export default function CardDistribuicaoStatus({ distribuicao, carregando }: Props) {
  const total = distribuicao?.total || 0

  return (
    <div className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-5 sm:col-span-2">
      <p className="text-[var(--text3)] text-xs uppercase tracking-wide mb-4">
        Distribuicao por status
      </p>

      {carregando ? (
        <p className="text-[var(--text2)]">...</p>
      ) : total === 0 ? (
        <p className="text-[var(--text2)] text-sm">Nenhum orçamento cadastrado ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {STATUS_INFO.map((s) => {
            const valor = (distribuicao?.[s.chave] as number) || 0
            const pct = total > 0 ? (valor / total) * 100 : 0
            return (
              <div key={s.chave}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text2)' }}>
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background: s.cor,
                        display: 'inline-block',
                      }}
                    />
                    {s.label}
                  </span>
                  <span className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                    {valor}
                    <span style={{ color: 'var(--text3)', fontSize: '11px' }}> ({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--navy4)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: pct + '%',
                      height: '100%',
                      background: s.cor,
                      borderRadius: '3px',
                      transition: 'width .3s',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
