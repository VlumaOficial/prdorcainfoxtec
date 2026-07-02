import { useState } from 'react'
import { useKpis } from '../hooks/useKpis'
import Layout from '../components/Layout'
import { useDistribuicaoStatus } from '../hooks/useDistribuicaoStatus'
import CardDistribuicaoStatus from '../components/CardDistribuicaoStatus'
import { periodoPadrao, NOMES_MESES } from '../lib/periodo'
import { useAnosDisponiveis } from '../hooks/useAnosDisponiveis'
import type { Periodo } from '../lib/periodo'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Dashboard() {
  const [periodo, setPeriodo] = useState<Periodo>(periodoPadrao())
  const { kpis, carregando } = useKpis(periodo)
  const { distribuicao, carregando: carregandoDist } = useDistribuicaoStatus(periodo)

  // Anos disponiveis: buscados do banco (anos com orcamentos) + ano corrente
  const anos = useAnosDisponiveis()

  const sufixo = periodo.tudo ? 'no total' : 'no periodo'

  const cards = [
    { label: `Orcamentos ${sufixo}`, valor: kpis ? String(kpis.orcamentosNoMes) : '—', cor: 'text-[var(--text)]' },
    { label: 'Valor total orcado', valor: kpis ? formatarMoeda(kpis.valorTotalOrcado) : '—', cor: 'text-[var(--blue)]' },
    { label: 'Taxa de conversao', valor: kpis && kpis.taxaConversao !== null ? `${kpis.taxaConversao.toFixed(1)}%` : '—', cor: 'text-[var(--purple)]' },
    { label: 'Lucro projetado', valor: kpis ? formatarMoeda(kpis.lucroProjetado) : '—', cor: kpis && kpis.lucroProjetado < 0 ? 'text-[var(--red)]' : 'text-[var(--green)]' },
    { label: 'Clientes ativos', valor: kpis ? String(kpis.clientesAtivos) : '—', cor: 'text-[var(--text)]' },
    { label: 'Ticket medio', valor: kpis ? formatarMoeda(kpis.ticketMedio) : '—', cor: 'text-[var(--amber)]' },
  ]

  const selectClass =
    'bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] text-sm outline-none focus:border-[var(--green)] disabled:opacity-50'

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[var(--text)] text-2xl font-semibold mb-1">Dashboard</h1>
          <p className="text-[var(--text2)] text-sm">
            {periodo.tudo ? 'Todos os periodos' : `${NOMES_MESES[periodo.mes - 1]} de ${periodo.ano}`}
          </p>
        </div>

        {/* Filtro de periodo */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className={selectClass}
            value={periodo.mes}
            disabled={periodo.tudo}
            onChange={(e) => setPeriodo((p) => ({ ...p, mes: Number(e.target.value) }))}
          >
            {NOMES_MESES.map((nome, i) => (
              <option key={i} value={i + 1}>{nome}</option>
            ))}
          </select>
          <select
            className={selectClass}
            value={periodo.ano}
            disabled={periodo.tudo}
            onChange={(e) => setPeriodo((p) => ({ ...p, ano: Number(e.target.value) }))}
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPeriodo((p) => ({ ...p, tudo: !p.tudo }))}
            className="rounded-md px-3 py-2 text-sm font-semibold border transition-colors"
            style={{
              background: periodo.tudo ? 'var(--green)' : 'transparent',
              color: periodo.tudo ? '#fff' : 'var(--text2)',
              borderColor: periodo.tudo ? 'var(--green)' : 'var(--border2)',
            }}
          >
            Tudo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-5">
            <p className="text-[var(--text3)] text-xs uppercase tracking-wide mb-2">{c.label}</p>
            <p className={`text-2xl font-semibold ${c.cor}`}>{carregando ? '...' : c.valor}</p>
          </div>
        ))}
        <CardDistribuicaoStatus distribuicao={distribuicao} carregando={carregandoDist} />
      </div>
    </Layout>
  )
}
