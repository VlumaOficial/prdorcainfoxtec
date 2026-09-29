import { useEffect, useRef } from 'react'
import type { CabecalhoOrcamento, DadosCliente } from './useNovoOrcamento'
import type { ItemOrcamento } from './useItensOrcamento'
import type { ConfigGlobal } from './useConfigGlobal'
import type { Cliente } from './useClientes'

export interface DadosRascunho {
  cabecalho: CabecalhoOrcamento
  cliente: DadosCliente
  clienteVinculado: Cliente | null
  clienteAvulso: boolean
  itens: ItemOrcamento[]
  config: ConfigGlobal
}

export interface RascunhoOrcamentoV1 {
  versao: 1
  atualizadoEm: string
  // Reservado para a Fase B (rascunho tambem persistido no banco, upsert debounced). Na Fase A
  // (so localStorage) fica sempre null. Ver docs/RASCUNHO_LOCAL.md.
  orcamentoIdBanco: string | null
  dados: DadosRascunho
}

const DEBOUNCE_MS = 1500

// Rascunho automatico de orcamento em localStorage (Fase A). Uma chave por contexto:
// 'orcamento_rascunho_novo' pra criacao, 'orcamento_rascunho_editar_<id>' pra edicao.
// Ver docs/RASCUNHO_LOCAL.md para o desenho completo e o roadmap da Fase B (rascunho no banco).
export function useRascunhoLocal(chave: string) {
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  function agendarSalvar(dados: DadosRascunho) {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      const rascunho: RascunhoOrcamentoV1 = {
        versao: 1,
        atualizadoEm: new Date().toISOString(),
        orcamentoIdBanco: null,
        dados,
      }
      try {
        localStorage.setItem(chave, JSON.stringify(rascunho))
      } catch {
        // localStorage indisponivel (modo privado, quota estourada) - rascunho e so uma
        // rede de seguranca, nunca deve quebrar o formulario
      }
    }, DEBOUNCE_MS)
  }

  function carregarRascunho(): RascunhoOrcamentoV1 | null {
    try {
      const bruto = localStorage.getItem(chave)
      if (!bruto) return null
      const parsed = JSON.parse(bruto)
      if (parsed?.versao !== 1) return null
      return parsed as RascunhoOrcamentoV1
    } catch {
      return null
    }
  }

  function limparRascunho() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    try {
      localStorage.removeItem(chave)
    } catch {
      // ignora
    }
  }

  return { agendarSalvar, carregarRascunho, limparRascunho }
}
