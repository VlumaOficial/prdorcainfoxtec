import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'expirado'

export interface DistribuicaoStatus {
  rascunho: number
  enviado: number
  aprovado: number
  recusado: number
  expirado: number
  total: number
}

// Calcula o status efetivo (enviado + vencido = expirado), igual a listagem
function statusEfetivo(status: string, validade: string | null): StatusOrcamento {
  if (status === 'enviado' && validade) {
    const hoje = new Date().toISOString().slice(0, 10)
    if (validade < hoje) return 'expirado'
  }
  return status as StatusOrcamento
}

export function useDistribuicaoStatus() {
  const [distribuicao, setDistribuicao] = useState<DistribuicaoStatus | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    async function buscar() {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('status, validade')

      if (!ativo) return
      if (error || !data) {
        setDistribuicao({ rascunho: 0, enviado: 0, aprovado: 0, recusado: 0, expirado: 0, total: 0 })
        setCarregando(false)
        return
      }

      const acc: DistribuicaoStatus = {
        rascunho: 0,
        enviado: 0,
        aprovado: 0,
        recusado: 0,
        expirado: 0,
        total: 0,
      }
      for (const row of data as { status: string; validade: string | null }[]) {
        const s = statusEfetivo(row.status, row.validade)
        acc[s] = (acc[s] || 0) + 1
        acc.total += 1
      }

      setDistribuicao(acc)
      setCarregando(false)
    }
    buscar()
    return () => {
      ativo = false
    }
  }, [])

  return { distribuicao, carregando }
}
