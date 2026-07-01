import { supabase } from '../lib/supabase'
import type { CabecalhoOrcamento, DadosCliente } from './useNovoOrcamento'
import type { ItemOrcamento } from './useItensOrcamento'
import type { ConfigGlobal } from './useConfigGlobal'
import type { Cliente } from './useClientes'

export interface OrcamentoCompleto {
  cabecalho: CabecalhoOrcamento
  cliente: DadosCliente
  clienteVinculado: Cliente | null
  clienteAvulso: boolean
  itens: ItemOrcamento[]
  config: ConfigGlobal
  status: string
}

// Gera um id local para os itens (o estado do app usa id string)
function novoId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Busca um orcamento completo do banco e mapeia snake_case -> camelCase do estado
export async function carregarOrcamento(id: string): Promise<OrcamentoCompleto | null> {
  // 1. Cabecalho do orcamento
  const { data: orc, error: errOrc } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('id', id)
    .single()

  if (errOrc || !orc) return null

  // 2. Itens do orcamento
  const { data: itensRows, error: errItens } = await supabase
    .from('orcamento_itens')
    .select('*')
    .eq('orcamento_id', id)
    .order('ordem', { ascending: true })

  if (errItens) return null

  // 3. Se vinculado a um cliente, busca o registro do cliente
  let clienteVinculado: Cliente | null = null
  if (orc.cliente_id) {
    const { data: cli } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', orc.cliente_id)
      .single()
    if (cli) clienteVinculado = cli as Cliente
  }

  const cabecalho: CabecalhoOrcamento = {
    numero: orc.numero || '',
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
  }

  const itens: ItemOrcamento[] = (itensRows || []).map((r: Record<string, unknown>) => ({
    id: novoId(),
    descricao: (r.descricao as string) || '',
    qtd: Number(r.qtd) || 1,
    custoUnit: Number(r.custo_unit) || 0,
    produtoVinculado: null, // sera resolvido ao salvar; edicao mantem descricao
    produtoAvulso: !r.produto_id,
    produtoEditando: false,
    usaImpGlobal: r.usa_imp_global as boolean,
    impPct: Number(r.imp_pct) || 0,
    usaMargGlobal: r.usa_marg_global as boolean,
    margPct: Number(r.marg_pct) || 0,
    usaDescGlobal: r.usa_desc_global as boolean,
    descPct: Number(r.desc_pct) || 0,
    descFix: Number(r.desc_fix) || 0,
  }))

  // Determina se o cliente e avulso: tem nome mas nao esta vinculado
  const clienteAvulso = !clienteVinculado && (cliente.nome.trim().length > 0)

  return {
    cabecalho,
    cliente,
    clienteVinculado,
    clienteAvulso,
    itens: itens.length > 0 ? itens : [],
    config,
    status: orc.status || 'rascunho',
  }
}
