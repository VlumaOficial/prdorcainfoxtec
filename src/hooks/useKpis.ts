import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Kpis {
  orcamentosNoMes: number
  valorTotalOrcado: number
  taxaConversao: number | null
  lucroProjetado: number
  clientesAtivos: number
  ticketMedio: number
}

export function useKpis() {
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscar() {
      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)

      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('total_final, total_lucro, status')
        .gte('created_at', inicioMes.toISOString())

      const { count: clientesAtivos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      const lista = orcamentos ?? []
      const orcamentosNoMes = lista.length
      const valorTotalOrcado = lista.reduce((s, o) => s + (o.total_final ?? 0), 0)
      const lucroProjetado = lista.reduce((s, o) => s + (o.total_lucro ?? 0), 0)
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
  }, [])

  return { kpis, carregando }
}
