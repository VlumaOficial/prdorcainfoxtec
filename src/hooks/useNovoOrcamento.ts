import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Cliente } from './useClientes'

export interface DadosCliente {
  nome: string
  cnpj: string
  endereco: string
  responsavel: string
  emailTelefone: string
}

export interface CabecalhoOrcamento {
  numero: string
  dataEmissao: string
  validade: string
  titulo: string
  condicoesPagamento: string
  observacoesGerais: string
  emailContato: string
  telefoneContato: string
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

function em30Dias(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export function useNovoOrcamento() {
  const [cabecalho, setCabecalho] = useState<CabecalhoOrcamento>({
    numero: '',
    dataEmissao: hoje(),
    validade: em30Dias(),
    titulo: '',
    condicoesPagamento: '',
    observacoesGerais: '',
    emailContato: '',
    telefoneContato: '',
  })

  const [cliente, setCliente] = useState<DadosCliente>({
    nome: '',
    cnpj: '',
    endereco: '',
    responsavel: '',
    emailTelefone: '',
  })

  const [clienteVinculado, setClienteVinculado] = useState<Cliente | null>(null)
  const [clienteBusca, setClienteBusca] = useState('')
  const [clienteAvulso, setClienteAvulso] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(false)

  const [carregandoNumero, setCarregandoNumero] = useState(true)

  useEffect(() => {
    async function buscarNumeroSugerido() {
      const perfil = await supabase.auth.getUser()
      const userId = perfil.data.user?.id
      const { data: usuarioRow } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', userId)
        .single()

      if (!usuarioRow) {
        setCarregandoNumero(false)
        return
      }

      const { data, error } = await supabase.rpc('sugerir_numero_orcamento', {
        p_empresa_id: usuarioRow.empresa_id,
      })

      if (!error && data) {
        setCabecalho((prev) => ({ ...prev, numero: data }))
      }
      setCarregandoNumero(false)
    }

    buscarNumeroSugerido()
  }, [])

  function atualizarCampo<K extends keyof CabecalhoOrcamento>(
    campo: K,
    valor: CabecalhoOrcamento[K]
  ) {
    setCabecalho((prev) => ({ ...prev, [campo]: valor }))
  }

  function atualizarCliente(campo: string, valor: string) {
    setCliente((prev) => ({ ...prev, [campo]: valor }))
  }

  function editarClienteVinculado() {
    setClienteEditando(true)
  }

  function selecionarClienteExistente(c: Cliente) {
    setClienteVinculado(c)
    setClienteEditando(false)
    setClienteAvulso(false)
    setClienteBusca(c.nome)
    setCliente({
      nome: c.nome,
      cnpj: c.cnpj || '',
      endereco: c.endereco || '',
      responsavel: c.responsavel || '',
      emailTelefone: c.email || c.telefone || '',
    })
  }

  function cadastrarClienteNovo(nome: string) {
    setClienteVinculado(null)
    setClienteAvulso(false)
    setCliente((prev) => ({ ...prev, nome }))
  }

  function usarClienteAvulso(nome: string) {
    setClienteVinculado(null)
    setClienteAvulso(true)
    setCliente((prev) => ({ ...prev, nome }))
  }

  function desvincularCliente() {
    setClienteEditando(false)
    setClienteVinculado(null)
    setClienteAvulso(false)
    setClienteBusca('')
    setCliente({ nome: '', cnpj: '', endereco: '', responsavel: '', emailTelefone: '' })
  }

  return {
    cabecalho,
    atualizarCampo,
    cliente,
    atualizarCliente,
    clienteVinculado,
    clienteBusca,
    setClienteBusca,
    clienteAvulso,
    clienteEditando,
    editarClienteVinculado,
    selecionarClienteExistente,
    cadastrarClienteNovo,
    usarClienteAvulso,
    desvincularCliente,
    carregandoNumero,
  }
}
