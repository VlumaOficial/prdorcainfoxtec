import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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

  return {
    cabecalho,
    atualizarCampo,
    cliente,
    atualizarCliente,
    carregandoNumero,
  }
}
