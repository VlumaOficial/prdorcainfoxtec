import { useState } from 'react'
import type { Produto } from './useProdutos'

export interface ItemOrcamento {
  id: string
  descricao: string
  qtd: number
  custoUnit: number
  produtoVinculado: Produto | null
  produtoAvulso: boolean
  produtoEditando: boolean
  usaImpGlobal: boolean
  impPct: number
  usaMargGlobal: boolean
  margPct: number
  usaDescGlobal: boolean
  descPct: number
  descFix: number
}

function novoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function itemVazio(): ItemOrcamento {
  return {
    id: novoId(),
    descricao: '',
    qtd: 1,
    custoUnit: 0,
    produtoVinculado: null,
    produtoAvulso: false,
    produtoEditando: false,
    usaImpGlobal: true,
    impPct: 0,
    usaMargGlobal: true,
    margPct: 0,
    usaDescGlobal: true,
    descPct: 0,
    descFix: 0,
  }
}

export function useItensOrcamento() {
  const [itens, setItens] = useState<ItemOrcamento[]>([itemVazio()])
  const [buscaPorItem, setBuscaPorItem] = useState<Record<string, string>>({})

  function adicionarItem() {
    setItens((prev) => [...prev, itemVazio()])
  }

  function removerItem(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id))
  }

  function atualizarItem(id: string, campo: keyof ItemOrcamento, valor: unknown) {
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [campo]: valor } : i))
    )
  }

  function buscarItem(id: string, texto: string) {
    setBuscaPorItem((prev) => ({ ...prev, [id]: texto }))
  }

  function selecionarProduto(id: string, produto: Produto) {
    setItens((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              descricao: produto.nome,
              custoUnit: produto.custo_padrao,
              produtoVinculado: produto,
              produtoAvulso: false,
              produtoEditando: false,
            }
          : i
      )
    )
  }

  function cadastrarProdutoNovo(id: string, nome: string) {
    setItens((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, descricao: nome, produtoVinculado: null, produtoAvulso: false }
          : i
      )
    )
  }

  function usarProdutoAvulso(id: string, nome: string) {
    setItens((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, descricao: nome, produtoVinculado: null, produtoAvulso: true }
          : i
      )
    )
  }

  function editarProdutoVinculado(id: string) {
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, produtoEditando: true } : i))
    )
  }

  function desvincularProduto(id: string) {
    setItens((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              descricao: '',
              custoUnit: 0,
              produtoVinculado: null,
              produtoAvulso: false,
              produtoEditando: false,
            }
          : i
      )
    )
  }

  function carregar(novosItens: ItemOrcamento[]) {
    setItens(novosItens.length > 0 ? novosItens : [itemVazio()])
  }

  function resetar() {
    setItens([itemVazio()])
  }

  return {
    itens,
    buscaPorItem,
    carregar,
    resetar,
    buscarItem,
    adicionarItem,
    removerItem,
    atualizarItem,
    selecionarProduto,
    cadastrarProdutoNovo,
    usarProdutoAvulso,
    editarProdutoVinculado,
    desvincularProduto,
  }
}
