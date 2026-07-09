import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useOrcamentos } from '../hooks/useOrcamentos'
import type { StatusOrcamento } from '../hooks/useOrcamentos'
import { fmtBR } from '../lib/numeros'

type FiltroStatus = 'todos' | StatusOrcamento

const STATUS_INFO: Record<StatusOrcamento, { label: string; cor: string; bg: string }> = {
  rascunho: { label: 'Rascunho', cor: 'var(--text2)', bg: 'var(--navy4)' },
  enviado: { label: 'Enviado', cor: 'var(--blue)', bg: 'rgba(59,130,246,.12)' },
  aprovado: { label: 'Aprovado', cor: 'var(--green)', bg: 'var(--green-dim)' },
  recusado: { label: 'Recusado', cor: 'var(--red)', bg: 'var(--red-dim)' },
  expirado: { label: 'Expirado', cor: 'var(--amber)', bg: 'rgba(245,158,11,.12)' },
}

function StatusBadge({ status }: { status: StatusOrcamento }) {
  const info = STATUS_INFO[status]
  return (
    <span
      style={{
        color: info.cor,
        background: info.bg,
        fontSize: '11px',
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {info.label}
    </span>
  )
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function Orcamentos() {
  const { orcamentos, carregando, excluir } = useOrcamentos()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const navigate = useNavigate()

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return orcamentos.filter((o) => {
      const casaBusca =
        termo === '' ||
        o.numero.toLowerCase().includes(termo) ||
        (o.titulo || '').toLowerCase().includes(termo) ||
        (o.cliente_nome || '').toLowerCase().includes(termo)
      const casaFiltro = filtro === 'todos' || o.status === filtro
      return casaBusca && casaFiltro
    })
  }, [orcamentos, busca, filtro])

  async function handleExcluir(id: string, numero: string) {
    if (confirm(`Excluir o orçamento ${numero}? Esta ação não pode ser desfeita.`)) {
      try {
        await excluir(id)
      } catch (e) {
        alert('Erro ao excluir: ' + (e instanceof Error ? e.message : 'erro'))
      }
    }
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[var(--text)] text-2xl font-semibold mb-1">Orçamentos</h1>
          <p className="text-[var(--text2)] text-sm">
            {orcamentos.length} orçamento{orcamentos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/orcamentos/novo')}
          className="bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md px-4 py-2.5 font-semibold text-sm whitespace-nowrap"
        >
          + Novo Orçamento
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por numero, titulo ou cliente..."
          className="flex-1 sm:max-w-md bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--green)]"
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as FiltroStatus)}
          className="bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--green)]"
        >
          <option value="todos">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="enviado">Enviado</option>
          <option value="aprovado">Aprovado</option>
          <option value="recusado">Recusado</option>
          <option value="expirado">Expirado</option>
        </select>
      </div>

      {/* Tabela — desktop */}
      <div className="hidden md:block bg-[var(--navy2)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Numero</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Titulo</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Cliente</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide text-right">Valor</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Emissao</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--text2)]">Carregando...</td>
              </tr>
            )}
            {!carregando && filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--text2)]">Nenhum orçamento encontrado</td>
              </tr>
            )}
            {filtrados.map((o) => (
              <tr key={o.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[var(--text)] font-mono text-xs">{o.numero}</td>
                <td className="px-4 py-3 text-[var(--text)]">{o.titulo || '—'}</td>
                <td className="px-4 py-3 text-[var(--text2)]">{o.cliente_nome || '—'}</td>
                <td className="px-4 py-3 text-[var(--text)] text-right font-mono">{fmtBR(o.total_final)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-[var(--text2)] text-xs">{formatarData(o.data_emissao)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => navigate('/orcamentos/' + o.id)}
                    className="text-[var(--blue)] text-xs mr-3 hover:underline"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={() => handleExcluir(o.id, o.numero)}
                    className="text-[var(--red)] text-xs hover:underline"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {carregando && <p className="text-center text-[var(--text2)] py-6">Carregando...</p>}
        {!carregando && filtrados.length === 0 && (
          <p className="text-center text-[var(--text2)] py-6">Nenhum orçamento encontrado</p>
        )}
        {filtrados.map((o) => (
          <div key={o.id} className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--text)] font-mono text-xs">{o.numero}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-[var(--text)] font-medium mb-1">{o.titulo || '—'}</p>
            <p className="text-[var(--text2)] text-sm mb-1">{o.cliente_nome || '—'}</p>
            <p className="text-[var(--text)] font-mono mb-3">{fmtBR(o.total_final)}</p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/orcamentos/' + o.id)}
                className="text-[var(--blue)] text-sm"
              >
                Abrir
              </button>
              <button
                onClick={() => handleExcluir(o.id, o.numero)}
                className="text-[var(--red)] text-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
