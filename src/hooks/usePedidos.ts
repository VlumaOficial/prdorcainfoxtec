import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type StatusPedido = 'em_execucao' | 'entregue' | 'faturado' | 'cancelado'

export interface PedidoLista {
  id: string
  numero: string
  status: StatusPedido
  data_criacao: string
  valor_faturado: number | null
  orcamento_id: string
  orcamento_numero: string
  cliente_nome: string | null
}

interface OrcamentoEmbutido {
  numero: string
  cliente_nome: string | null
}

export function usePedidos() {
  const [pedidos, setPedidos] = useState<PedidoLista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, numero, status, data_criacao, valor_faturado, orcamento_id, orcamentos(numero, cliente_nome)')
      .order('data_criacao', { ascending: false })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }

    const lista = (data || []).map((p: Record<string, unknown>) => {
      const orc = p.orcamentos as OrcamentoEmbutido | null
      return {
        id: p.id as string,
        numero: p.numero as string,
        status: p.status as StatusPedido,
        data_criacao: p.data_criacao as string,
        valor_faturado: p.valor_faturado != null ? Number(p.valor_faturado) : null,
        orcamento_id: p.orcamento_id as string,
        orcamento_numero: orc?.numero || '',
        cliente_nome: orc?.cliente_nome || null,
      }
    }) as PedidoLista[]

    setPedidos(lista)
    setCarregando(false)
  }, [])

  useEffect(() => {
    buscar()
  }, [buscar])

  return { pedidos, carregando, erro, buscar }
}
