import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Produto {
  id: string
  nome: string
  descricao: string | null
  custo_padrao: number
  ativo: boolean
  created_at: string
}

export type FiltroStatus = 'ativos' | 'inativos' | 'todos'

export function useProdutos(filtro: FiltroStatus = 'ativos') {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const buscar = useCallback(async () => {
    setCarregando(true)
    let query = supabase.from('produtos').select('*').order('nome', { ascending: true })

    if (filtro === 'ativos') query = query.eq('ativo', true)
    if (filtro === 'inativos') query = query.eq('ativo', false)

    const { data, error } = await query

    if (error) {
      setErro(error.message)
    } else {
      setProdutos(data ?? [])
    }
    setCarregando(false)
  }, [filtro])

  useEffect(() => {
    buscar()
  }, [buscar])

  async function criar(produto: { nome: string; descricao: string; custo_padrao: number }) {
    const perfil = await supabase.auth.getUser()
    const userId = perfil.data.user?.id
    const { data: usuarioRow } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', userId)
      .single()

    const { error } = await supabase.from('produtos').insert({
      ...produto,
      empresa_id: usuarioRow?.empresa_id,
    })

    if (error) throw new Error(error.message)
    await buscar()
  }

  async function atualizar(id: string, produto: Partial<Produto>) {
    const { error } = await supabase
      .from('produtos')
      .update(produto)
      .eq('id', id)

    if (error) throw new Error(error.message)
    await buscar()
  }

  async function inativar(id: string) {
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
    await buscar()
  }

  async function reativar(id: string) {
    const { error } = await supabase
      .from('produtos')
      .update({ ativo: true })
      .eq('id', id)

    if (error) throw new Error(error.message)
    await buscar()
  }

  return { produtos, carregando, erro, criar, atualizar, inativar, reativar, recarregar: buscar }
}
