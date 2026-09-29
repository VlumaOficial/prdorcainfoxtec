interface Props {
  atualizadoEm: string
  onRestaurar: () => void
  onDescartar: () => void
}

function formatarDataHora(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Aviso de rascunho local nao salvo, encontrado ao abrir /orcamentos/novo ou /orcamentos/:id.
// Nunca restaura automaticamente - o usuario decide, pra nao sobrescrever um comeco novo com
// lixo antigo por engano.
export default function BannerRascunho({ atualizadoEm, onRestaurar, onDescartar }: Props) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-3 rounded-lg"
      style={{ background: 'rgba(245,158,11,.12)', border: '1px solid var(--amber)' }}
    >
      <p style={{ color: 'var(--text)', fontSize: '13px' }}>
        Encontramos um rascunho não salvo de {formatarDataHora(atualizadoEm)}.
      </p>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={onRestaurar}
          style={{
            background: 'var(--amber)',
            color: '#1a1300',
            fontWeight: 600,
            fontSize: '13px',
            padding: '6px 14px',
            borderRadius: '7px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Restaurar
        </button>
        <button
          type="button"
          onClick={onDescartar}
          style={{
            background: 'transparent',
            color: 'var(--text2)',
            fontSize: '13px',
            padding: '6px 10px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Descartar
        </button>
      </div>
    </div>
  )
}
