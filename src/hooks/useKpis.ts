import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { limitesDoPeriodo } from '../lib/periodo'
import type { Periodo } from '../lib/periodo'

interface Kpis {
  orcamentosNoMes: number
  valorTotalOrcado: number
  taxaConversao: number | null
  lucroProjetado: number
  clientesAtivos: number
  ticketMedio: number
}

export function useKpis(periodo: Periodo) {
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscar() {
      setCarregando(true)
      const limites = limitesDoPeriodo(periodo)

      let query = supabase.from('orcamentos').select('total_final, total_lucro, status')
      if (limites) {
        query = query.gte('data_emissao', limites.inicio).lt('data_emissao', limites.fim)
      }
      const { data: orcamentos } = await query

      const { count: clientesAtivos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      const lista = (orcamentos ?? []) as { total_final: unknown; total_lucro: unknown; status: string }[]
      const orcamentosNoMes = lista.length
      const valorTotalOrcado = lista.reduce((s, o) => s + (Number(o.total_final) || 0), 0)
      const lucroProjetado = lista.reduce((s, o) => s + (Number(o.total_lucro) || 0), 0)
      const aprovados = lista.filter((o) => o.status === 'aprovado').length
      const taxaConversao = orcamentosNoMes > 0 ? (aprovados / orcamentosNoMes) * 100 : null
      const ticketMedio = orcamentosNoMes > 0 ? valorTotalOrcado / orcamentosNoMes : 0

      setKpis({
        orcamentosNoMes,
        valorTotalOrcado,
        taxaConversao,
        lucroProjetado,
        clientesAtivos: clientesAtivos ?? 0,
        ticketMedio,
      })
      setCarregando(false)
    }
    buscar()
  }, [periodo.mes, periodo.ano, periodo.tudo])

  return { kpis, carregando }
}
