import { useKpis } from '../hooks/useKpis'
import Layout from '../components/Layout'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function Dashboard() {
  const { kpis, carregando } = useKpis()

  const cards = [
    {
      label: 'Orçamentos no mês',
      valor: kpis ? String(kpis.orcamentosNoMes) : '—',
      cor: 'text-[var(--text)]',
    },
    {
      label: 'Valor total orçado',
      valor: kpis ? formatarMoeda(kpis.valorTotalOrcado) : '—',
      cor: 'text-[var(--blue)]',
    },
    {
      label: 'Taxa de conversão',
      valor:
        kpis && kpis.taxaConversao !== null
          ? `${kpis.taxaConversao.toFixed(1)}%`
          : '—',
      cor: 'text-[var(--purple)]',
    },
    {
      label: 'Lucro projetado',
      valor: kpis ? formatarMoeda(kpis.lucroProjetado) : '—',
      cor: kpis && kpis.lucroProjetado < 0 ? 'text-[var(--red)]' : 'text-[var(--green)]',
    },
    {
      label: 'Clientes ativos',
      valor: kpis ? String(kpis.clientesAtivos) : '—',
      cor: 'text-[var(--text)]',
    },
    {
      label: 'Ticket médio',
      valor: kpis ? formatarMoeda(kpis.ticketMedio) : '—',
      cor: 'text-[var(--amber)]',
    },
  ]

  return (
    <Layout>
      <h1 className="text-[var(--text)] text-2xl font-semibold mb-1">
        Dashboard
      </h1>
      <p className="text-[var(--text2)] text-sm mb-8">
        Visão geral do mês atual
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-5"
          >
            <p className="text-[var(--text3)] text-xs uppercase tracking-wide mb-2">
              {c.label}
            </p>
            <p className={`text-2xl font-semibold ${c.cor}`}>
              {carregando ? '...' : c.valor}
            </p>
          </div>
        ))}
      </div>
    </Layout>
  )
}
