import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { calcularTotais } from '../lib/calculo'
import type { CabecalhoOrcamento, DadosCliente } from './useNovoOrcamento'
import type { ItemOrcamento } from './useItensOrcamento'
import type { ConfigGlobal } from './useConfigGlobal'
import type { Cliente } from './useClientes'

// IDs fixos da Infoxtec (multi-tenant single-empresa por enquanto)
const EMPRESA_ID = '24c1f3b2-aacc-4717-9de7-3dacab50fb91'
const USUARIO_ID = '3c0646f0-28ec-4d86-af41-cb8eee4e30d3'

interface DadosSalvar {
  cabecalho: CabecalhoOrcamento
  cliente: DadosCliente
  clienteVinculado: Cliente | null
  clienteAvulso: boolean
  itens: ItemOrcamento[]
  config: ConfigGlobal
}

export function useSalvarOrcamento() {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Cria um cliente novo no catalogo e retorna o id
  async function criarClienteNovo(cliente: DadosCliente): Promise<string> {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        empresa_id: EMPRESA_ID,
        nome: cliente.nome,
        cnpj: cliente.cnpj || null,
        endereco: cliente.endereco || null,
        responsavel: cliente.responsavel || null,
        email: cliente.emailTelefone || null,
      })
      .select('id')
      .single()

    if (error) throw new Error('Erro ao cadastrar cliente: ' + error.message)
    return data.id as string
  }

  // Cria um produto novo no catalogo e retorna o id
  async function criarProdutoNovo(descricao: string, custo: number): Promise<string> {
    const { data, error } = await supabase
      .from('produtos')
      .insert({
        empresa_id: EMPRESA_ID,
        nome: descricao,
        descricao: null,
        custo_padrao: custo,
      })
      .select('id')
      .single()

    if (error) throw new Error('Erro ao cadastrar produto: ' + error.message)
    return data.id as string
  }

  async function salvar(dados: DadosSalvar): Promise<string | null> {
    setSalvando(true)
    setErro(null)

    try {
      const { cabecalho, cliente, clienteVinculado, clienteAvulso, itens, config } = dados

      if (itens.length === 0) {
        setErro('Adicione ao menos um item ao orcamento.')
        return null
      }

      // ── 1. Resolve o cliente ──
      // Vinculado: usa o id existente. Avulso: sem id (so snapshot).
      // Cadastrar novo: nao vinculado, nao avulso, mas com nome -> cria no catalogo.
      let clienteId = ''
      if (clienteVinculado) {
        clienteId = clienteVinculado.id
      } else if (!clienteAvulso && cliente.nome.trim().length > 0) {
        clienteId = await criarClienteNovo(cliente)
      }

      // ── 2. Resolve os produtos dos itens ──
      // Para cada item: vinculado usa id; avulso sem id; cadastrar novo cria.
      const itensResolvidos = await Promise.all(
        itens.map(async (item) => {
          let produtoId = ''
          if (item.produtoVinculado) {
            produtoId = item.produtoVinculado.id
          } else if (!item.produtoAvulso && item.descricao.trim().length > 0) {
            produtoId = await criarProdutoNovo(item.descricao, item.custoUnit)
          }
          return { item, produtoId }
        })
      )

      // ── 3. Calcula os totais (snapshot) ──
      const t = calcularTotais(itens, config)

      // ── 4. Monta o payload do cabecalho ──
      const payloadOrcamento = {
        empresa_id: EMPRESA_ID,
        cliente_id: clienteId,
        numero: cabecalho.numero,
        data_emissao: cabecalho.dataEmissao,
        validade: cabecalho.validade || '',
        titulo: cabecalho.titulo || '',
        observacoes_gerais: cabecalho.observacoesGerais || '',
        condicoes_pagamento: cabecalho.condicoesPagamento || '',
        email_contato: cabecalho.emailContato || '',
        telefone_contato: cabecalho.telefoneContato || '',
        cliente_nome: cliente.nome || '',
        cliente_cnpj: cliente.cnpj || '',
        cliente_endereco: cliente.endereco || '',
        cliente_responsavel: cliente.responsavel || '',
        cliente_email_telefone: cliente.emailTelefone || '',
        imposto_pct: config.impPct,
        margem_pct: config.margPct,
        desconto_pct: config.descPct,
        total_custo: t.tCusto,
        total_imposto: t.tImp,
        total_desconto: t.tDesc,
        total_lucro: t.tLuc,
        total_final: t.tFinal,
        status: 'rascunho',
        criado_por: USUARIO_ID,
      }

      // ── 5. Monta o payload dos itens ──
      const payloadItens = itensResolvidos.map(({ item, produtoId }) => ({
        produto_id: produtoId,
        descricao: item.descricao || '',
        qtd: item.qtd,
        custo_unit: item.custoUnit,
        usa_imp_global: item.usaImpGlobal,
        imp_pct: item.usaImpGlobal ? '' : item.impPct,
        usa_marg_global: item.usaMargGlobal,
        marg_pct: item.usaMargGlobal ? '' : item.margPct,
        usa_desc_global: item.usaDescGlobal,
        desc_pct: item.usaDescGlobal ? '' : item.descPct,
        desc_fix: item.descFix > 0 ? item.descFix : '',
      }))

      // ── 6. Chama a RPC transacional ──
      const { data, error } = await supabase.rpc('salvar_orcamento', {
        p_orcamento: payloadOrcamento,
        p_itens: payloadItens,
      })

      if (error) {
        setErro('Erro ao salvar: ' + error.message)
        return null
      }

      return data as string
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado ao salvar o orcamento.'
      setErro(msg)
      return null
    } finally {
      setSalvando(false)
    }
  }

  return { salvar, salvando, erro }
}
