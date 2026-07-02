import type { ItemOrcamento } from '../hooks/useItensOrcamento'
import type { DadosCliente } from '../hooks/useNovoOrcamento'
import type { Cliente } from '../hooks/useClientes'

export interface DivergenciaProduto {
  tipo: 'produto'
  produtoId: string
  nome: string
  mudancas: { campo: string; de: string; para: string }[]
  // novos valores para aplicar ao catalogo
  novoNome: string
  novoCusto: number
}

export interface DivergenciaCliente {
  tipo: 'cliente'
  clienteId: string
  nome: string
  mudancas: { campo: string; de: string; para: string }[]
  // novos valores para aplicar ao catalogo
  novos: {
    nome: string
    cnpj: string
    endereco: string
    responsavel: string
    email: string
  }
}

export type Divergencia = DivergenciaProduto | DivergenciaCliente

function fmtNum(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Detecta divergencias entre os dados editados no orcamento e o cadastro no catalogo.
export function detectarDivergencias(
  itens: ItemOrcamento[],
  cliente: DadosCliente,
  clienteVinculado: Cliente | null
): Divergencia[] {
  const divergencias: Divergencia[] = []

  // ── Produtos vinculados ──
  // Evita duplicar: um mesmo produto pode aparecer em varios itens; consideramos o primeiro item de cada produto.
  const produtosVistos = new Set<string>()
  for (const item of itens) {
    const p = item.produtoVinculado
    if (!p) continue
    if (produtosVistos.has(p.id)) continue
    produtosVistos.add(p.id)

    const mudancas: { campo: string; de: string; para: string }[] = []
    if ((item.descricao || '').trim() !== (p.nome || '').trim()) {
      mudancas.push({ campo: 'Nome', de: p.nome, para: item.descricao })
    }
    if (Number(item.custoUnit) !== Number(p.custo_padrao)) {
      mudancas.push({ campo: 'Custo', de: 'R$ ' + fmtNum(p.custo_padrao), para: 'R$ ' + fmtNum(item.custoUnit) })
    }

    if (mudancas.length > 0) {
      divergencias.push({
        tipo: 'produto',
        produtoId: p.id,
        nome: p.nome,
        mudancas,
        novoNome: item.descricao,
        novoCusto: item.custoUnit,
      })
    }
  }

  // ── Cliente vinculado ──
  if (clienteVinculado) {
    const c = clienteVinculado
    const mudancas: { campo: string; de: string; para: string }[] = []
    const emailCadastro = c.email || c.telefone || ''

    if ((cliente.nome || '').trim() !== (c.nome || '').trim()) {
      mudancas.push({ campo: 'Nome', de: c.nome, para: cliente.nome })
    }
    if ((cliente.cnpj || '').trim() !== (c.cnpj || '').trim()) {
      mudancas.push({ campo: 'CNPJ', de: c.cnpj || '—', para: cliente.cnpj || '—' })
    }
    if ((cliente.endereco || '').trim() !== (c.endereco || '').trim()) {
      mudancas.push({ campo: 'Endereco', de: c.endereco || '—', para: cliente.endereco || '—' })
    }
    if ((cliente.responsavel || '').trim() !== (c.responsavel || '').trim()) {
      mudancas.push({ campo: 'Responsavel', de: c.responsavel || '—', para: cliente.responsavel || '—' })
    }
    if ((cliente.emailTelefone || '').trim() !== (emailCadastro || '').trim()) {
      mudancas.push({ campo: 'Contato', de: emailCadastro || '—', para: cliente.emailTelefone || '—' })
    }

    if (mudancas.length > 0) {
      divergencias.push({
        tipo: 'cliente',
        clienteId: c.id,
        nome: c.nome,
        mudancas,
        novos: {
          nome: cliente.nome,
          cnpj: cliente.cnpj,
          endereco: cliente.endereco,
          responsavel: cliente.responsavel,
          email: cliente.emailTelefone,
        },
      })
    }
  }

  return divergencias
}
