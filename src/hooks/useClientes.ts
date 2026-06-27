import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Cliente {
  id: string
  nome: string
  cnpj: string | null
  endereco: string | null
  responsavel: string | null
  email: string | null
  telefone: string | null
  ativo: boolean
  created_at: string
}

export type FiltroStatus = 'ativos' | 'inativos' | 'todos'

export function useClientes(filtro: FiltroStatus = 'ativos') {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const buscar = useCallback(async () => {
    setCarregando(true)
    let query = supabase.from('clientes').select('*').order('nome', { ascending: true })

    if (filtro === 'ativos') query = query.eq('ativo', true)
    if (filtro === 'inativos') query = query.eq('ativo', false)

    const { data, error } = await query

    if (error) {
      setErro(error.message)
    } else {
      setClientes(data ?? [])
    }
    setCarregando(false)
  }, [filtro])

  useEffect(() => {
    buscar()
  }, [buscar])

  async function criar(cliente: Omit<Cliente, 'id' | 'ativo' | 'created_at'>) {
    const perfil = await supabase.auth.getUser()
    const userId = perfil.data.user?.id
    const { data: usuarioRow } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', userId)
      .single()

    const { error } = await supabase.from('clientes').insert({
      ...cliente,
      empresa_id: usuarioRow?.empresa_id,
    })

    if (error) throw new Error(error.message)
    await buscar()
  }

  async function atualizar(id: string, cliente: Partial<Cliente>) {
    const { error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)

    if (error) throw new Error(error.message)
    await buscar()
  }

  async function inativar(id: string) {
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
    await buscar()
  }

  async function reativar(id: string) {
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: true })
      .eq('id', id)

    if (error) throw new Error(error.message)
    await buscar()
  }

  return { clientes, carregando, erro, criar, atualizar, inativar, reativar, recarregar: buscar }
}
