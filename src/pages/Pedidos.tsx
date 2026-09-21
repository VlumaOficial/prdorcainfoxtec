import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { usePedidos } from '../hooks/usePedidos'
import type { StatusPedido } from '../hooks/usePedidos'
import { fmtBR } from '../lib/numeros'

type FiltroStatus = 'todos' | StatusPedido

const STATUS_INFO: Record<StatusPedido, { label: string; cor: string; bg: string }> = {
  em_execucao: { label: 'Em Execução', cor: 'var(--blue)', bg: 'rgba(59,130,246,.12)' },
  entregue: { label: 'Entregue', cor: 'var(--green)', bg: 'var(--green-dim)' },
  faturado: { label: 'Faturado', cor: 'var(--purple, #a855f7)', bg: 'rgba(168,85,247,.12)' },
  cancelado: { label: 'Cancelado', cor: 'var(--red)', bg: 'var(--red-dim)' },
}

function StatusBadge({ status }: { status: StatusPedido }) {
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
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export default function Pedidos() {
  const { pedidos, carregando } = usePedidos()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const navigate = useNavigate()

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return pedidos.filter((p) => {
      const casaBusca =
        termo === '' ||
        p.numero.toLowerCase().includes(termo) ||
        p.orcamento_numero.toLowerCase().includes(termo) ||
        (p.cliente_nome || '').toLowerCase().includes(termo)
      const casaFiltro = filtro === 'todos' || p.status === filtro
      return casaBusca && casaFiltro
    })
  }, [pedidos, busca, filtro])

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[var(--text)] text-2xl font-semibold mb-1">Pedidos</h1>
          <p className="text-[var(--text2)] text-sm">
            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por numero do pedido, orcamento ou cliente..."
          className="flex-1 sm:max-w-md bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--green)]"
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as FiltroStatus)}
          className="bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--green)]"
        >
          <option value="todos">Todos os status</option>
          <option value="em_execucao">Em Execução</option>
          <option value="entregue">Entregue</option>
          <option value="faturado">Faturado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Tabela — desktop */}
      <div className="hidden md:block bg-[var(--navy2)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Numero</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Orcamento</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Cliente</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide text-right">Valor faturado</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Criado em</th>
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
                <td colSpan={7} className="px-4 py-6 text-center text-[var(--text2)]">Nenhum pedido encontrado</td>
              </tr>
            )}
            {filtrados.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[var(--text)] font-mono text-xs">{p.numero}</td>
                <td className="px-4 py-3 text-[var(--text2)] font-mono text-xs">{p.orcamento_numero}</td>
                <td className="px-4 py-3 text-[var(--text2)]">{p.cliente_nome || '—'}</td>
                <td className="px-4 py-3 text-[var(--text)] text-right font-mono">
                  {p.valor_faturado != null ? fmtBR(p.valor_faturado) : '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-[var(--text2)] text-xs">{formatarData(p.data_criacao)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => navigate('/pedidos/' + p.id)}
                    className="text-[var(--blue)] text-xs hover:underline"
                  >
                    Abrir
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
          <p className="text-center text-[var(--text2)] py-6">Nenhum pedido encontrado</p>
        )}
        {filtrados.map((p) => (
          <div key={p.id} className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--text)] font-mono text-xs">{p.numero}</span>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-[var(--text2)] text-xs font-mono mb-1">Orcamento {p.orcamento_numero}</p>
            <p className="text-[var(--text2)] text-sm mb-1">{p.cliente_nome || '—'}</p>
            <p className="text-[var(--text)] font-mono mb-3">
              {p.valor_faturado != null ? fmtBR(p.valor_faturado) : '—'}
            </p>
            <button onClick={() => navigate('/pedidos/' + p.id)} className="text-[var(--blue)] text-sm">
              Abrir
            </button>
          </div>
        ))}
      </div>
    </Layout>
  )
}
