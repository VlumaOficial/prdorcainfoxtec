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
  itens: ItemOrcamento[]
  config: ConfigGlobal
}

export function useSalvarOrcamento() {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(dados: DadosSalvar): Promise<string | null> {
    setSalvando(true)
    setErro(null)

    try {
      const { cabecalho, cliente, clienteVinculado, itens, config } = dados

      // Validacao minima
      if (itens.length === 0) {
        setErro('Adicione ao menos um item ao orcamento.')
        return null
      }

      // Calcula os totais (snapshot no momento do salvamento)
      const t = calcularTotais(itens, config)

      // Monta o payload do cabecalho
      const payloadOrcamento = {
        empresa_id: EMPRESA_ID,
        cliente_id: clienteVinculado ? clienteVinculado.id : '',
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

      // Monta o payload dos itens
      const payloadItens = itens.map((item) => ({
        produto_id: item.produtoVinculado ? item.produtoVinculado.id : '',
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

      // Chama a RPC transacional
      const { data, error } = await supabase.rpc('salvar_orcamento', {
        p_orcamento: payloadOrcamento,
        p_itens: payloadItens,
      })

      if (error) {
        setErro('Erro ao salvar: ' + error.message)
        return null
      }

      // data e o uuid do orcamento criado
      return data as string
    } catch (e) {
      setErro('Erro inesperado ao salvar o orcamento.')
      return null
    } finally {
      setSalvando(false)
    }
  }

  return { salvar, salvando, erro }
}
