import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'expirado' | 'cancelado'

export interface OrcamentoLista {
  id: string
  numero: string
  titulo: string | null
  cliente_nome: string | null
  data_emissao: string
  validade: string | null
  total_final: number
  status: StatusOrcamento
  created_at: string
}

// Calcula o status efetivo: se esta 'enviado' e passou da validade, vira 'expirado' (on-the-fly)
function statusEfetivo(status: string, validade: string | null): StatusOrcamento {
  if (status === 'enviado' && validade) {
    const hoje = new Date().toISOString().slice(0, 10)
    if (validade < hoje) return 'expirado'
  }
  return status as StatusOrcamento
}

export function useOrcamentos() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoLista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    const { data, error } = await supabase
      .from('orcamentos')
      .select('id, numero, titulo, cliente_nome, data_emissao, validade, total_final, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }

    const lista = (data || []).map((o: Record<string, unknown>) => ({
      ...o,
      total_final: Number(o.total_final),
      status: statusEfetivo(o.status as string, o.validade as string | null),
    })) as OrcamentoLista[]

    setOrcamentos(lista)
    setCarregando(false)
  }, [])

  useEffect(() => {
    buscar()
  }, [buscar])

  // Exclui um orcamento (os itens caem por cascade no banco)
  async function excluir(id: string) {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await buscar()
  }

  return { orcamentos, carregando, erro, buscar, excluir }
}
