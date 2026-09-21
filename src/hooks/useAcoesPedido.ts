import { useState } from 'react'
import { supabase } from '../lib/supabase'

export interface DadosFaturamento {
  numeroNf: string
  serieNf: string
  valorFaturado: number
  chaveAcessoNf?: string
}

export function useAcoesPedido() {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Gera um pedido a partir de itens ainda nao vinculados de um orcamento aprovado.
  async function criarPedido(orcamentoId: string, itensIds: string[]): Promise<string | null> {
    setSalvando(true)
    setErro(null)
    try {
      const { data, error } = await supabase.rpc('criar_pedido', {
        p_orcamento_id: orcamentoId,
        p_itens_ids: itensIds,
      })
      if (error) {
        setErro(error.message)
        return null
      }
      return data as string
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado ao gerar o pedido.')
      return null
    } finally {
      setSalvando(false)
    }
  }

  // Cancela um pedido (bloqueado se ja faturado). Pode cascatear cancelamento do orcamento.
  async function cancelarPedido(id: string): Promise<boolean> {
    setSalvando(true)
    setErro(null)
    try {
      const { error } = await supabase.rpc('cancelar_pedido', { p_id: id })
      if (error) {
        setErro(error.message)
        return false
      }
      return true
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado ao cancelar o pedido.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  async function marcarEntregue(id: string): Promise<boolean> {
    setSalvando(true)
    setErro(null)
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'entregue', data_entrega: new Date().toISOString().slice(0, 10) })
        .eq('id', id)
      if (error) {
        setErro(error.message)
        return false
      }
      return true
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado ao marcar como entregue.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  // Move o pedido para Faturado, gravando os dados fiscais informados no modal.
  async function marcarFaturado(id: string, dados: DadosFaturamento): Promise<boolean> {
    setSalvando(true)
    setErro(null)
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'faturado',
          data_faturamento: new Date().toISOString().slice(0, 10),
          numero_nf: dados.numeroNf,
          serie_nf: dados.serieNf,
          valor_faturado: dados.valorFaturado,
          chave_acesso_nf: dados.chaveAcessoNf || null,
        })
        .eq('id', id)
      if (error) {
        setErro(error.message)
        return false
      }
      return true
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado ao faturar o pedido.')
      return false
    } finally {
      setSalvando(false)
    }
  }

  return { criarPedido, cancelarPedido, marcarEntregue, marcarFaturado, salvando, erro }
}
