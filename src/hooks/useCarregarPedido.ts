import { supabase } from '../lib/supabase'
import type { CabecalhoOrcamento, DadosCliente } from './useNovoOrcamento'
import type { ItemOrcamento } from './useItensOrcamento'
import type { ConfigGlobal } from './useConfigGlobal'
import type { StatusPedido } from './usePedidos'

export interface PedidoCompleto {
  id: string
  numero: string
  status: StatusPedido
  observacoes: string
  dataEntrega: string
  dataFaturamento: string
  numeroNf: string
  serieNf: string
  valorFaturado: number | null
  chaveAcessoNf: string
  orcamentoId: string
  orcamentoNumero: string
  cabecalho: CabecalhoOrcamento
  cliente: DadosCliente
  config: ConfigGlobal
  itens: ItemOrcamento[]
}

function novoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// Busca um pedido completo: dados proprios + orcamento pai (cabecalho/cliente) + itens
// resolvidos a partir de orcamento_itens (somente leitura, pedido nao duplica valores).
export async function carregarPedido(id: string): Promise<PedidoCompleto | null> {
  const { data: ped, error: errPed } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', id)
    .single()

  if (errPed || !ped) return null

  const { data: orc, error: errOrc } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('id', ped.orcamento_id)
    .single()

  if (errOrc || !orc) return null

  const { data: vinculos, error: errVinculos } = await supabase
    .from('pedido_itens')
    .select('orcamento_item_id')
    .eq('pedido_id', id)

  if (errVinculos) return null

  const itemIds = (vinculos || []).map((r: Record<string, unknown>) => r.orcamento_item_id as string)

  let itensRows: Record<string, unknown>[] = []
  if (itemIds.length > 0) {
    const { data } = await supabase
      .from('orcamento_itens')
      .select('*')
      .in('id', itemIds)
      .order('ordem', { ascending: true })
    itensRows = data || []
  }

  const itens: ItemOrcamento[] = itensRows.map((r) => ({
    id: novoId(),
    descricao: (r.descricao as string) || '',
    qtd: Number(r.qtd) || 1,
    custoUnit: Number(r.custo_unit) || 0,
    produtoVinculado: null,
    produtoAvulso: true,
    produtoEditando: false,
    usaImpGlobal: r.usa_imp_global as boolean,
    impPct: Number(r.imp_pct) || 0,
    usaMargGlobal: r.usa_marg_global as boolean,
    margPct: Number(r.marg_pct) || 0,
    usaDescGlobal: r.usa_desc_global as boolean,
    descPct: Number(r.desc_pct) || 0,
    descFix: Number(r.desc_fix) || 0,
  }))

  const cabecalho: CabecalhoOrcamento = {
    numero: ped.numero || '',
    dataEmissao: orc.data_emissao || '',
    validade: orc.validade || '',
    titulo: orc.titulo || '',
    condicoesPagamento: orc.condicoes_pagamento || '',
    observacoesGerais: orc.observacoes_gerais || '',
    emailContato: orc.email_contato || '',
    telefoneContato: orc.telefone_contato || '',
  }

  const cliente: DadosCliente = {
    nome: orc.cliente_nome || '',
    cnpj: orc.cliente_cnpj || '',
    endereco: orc.cliente_endereco || '',
    responsavel: orc.cliente_responsavel || '',
    emailTelefone: orc.cliente_email_telefone || '',
  }

  const config: ConfigGlobal = {
    impPct: Number(orc.imposto_pct) || 0,
    margPct: Number(orc.margem_pct) || 0,
    descPct: Number(orc.desconto_pct) || 0,
    impNoPdf: false,
    descNoPdf: false,
    qtdPdf: false,
    valorUnitPdf: false,
    totalLinhaPdf: false,
  }

  return {
    id: ped.id,
    numero: ped.numero,
    status: ped.status as StatusPedido,
    observacoes: ped.observacoes || '',
    dataEntrega: ped.data_entrega || '',
    dataFaturamento: ped.data_faturamento || '',
    numeroNf: ped.numero_nf || '',
    serieNf: ped.serie_nf || '',
    valorFaturado: ped.valor_faturado != null ? Number(ped.valor_faturado) : null,
    chaveAcessoNf: ped.chave_acesso_nf || '',
    orcamentoId: ped.orcamento_id,
    orcamentoNumero: orc.numero || '',
    cabecalho,
    cliente,
    config,
    itens,
  }
}
