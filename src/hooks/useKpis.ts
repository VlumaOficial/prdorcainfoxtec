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

// Retorna 'YYYY-MM-DD' do primeiro dia do mes atual (sem hora, evita problema de fuso)
function primeiroDiaDoMes(): string {
  const d = new Date()
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${ano}-${mes}-01`
}

export function useKpis() {
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscar() {
      const inicioMes = primeiroDiaDoMes()

      // Filtra por data_emissao (data de negocio do orcamento), comparando por data
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('total_final, total_lucro, status')
        .gte('data_emissao', inicioMes)

      const { count: clientesAtivos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      const lista = (orcamentos ?? []) as { total_final: unknown; total_lucro: unknown; status: string }[]
      const orcamentosNoMes = lista.length
      // Converte para numero (o Supabase retorna numeric como string)
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
  }, [])

  return { kpis, carregando }
}
