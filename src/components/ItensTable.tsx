import type { ItemOrcamento } from '../hooks/useItensOrcamento'
import type { Produto } from '../hooks/useProdutos'
import ProdutoCombobox from './ProdutoCombobox'

interface Props {
  itens: ItemOrcamento[]
  onAdicionar: () => void
  onRemover: (id: string) => void
  onAtualizar: (id: string, campo: keyof ItemOrcamento, valor: unknown) => void
  onSelecionarProduto: (id: string, produto: Produto) => void
  onCadastrarNovo: (id: string, nome: string) => void
  onUsarAvulso: (id: string, nome: string) => void
  onEditar: (id: string) => void
  onDesvincular: (id: string) => void
  buscaPorItem: Record<string, string>
  onBuscarItem: (id: string, texto: string) => void
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ItensTable({
  itens,
  onAdicionar,
  onRemover,
  onAtualizar,
  onSelecionarProduto,
  onCadastrarNovo,
  onUsarAvulso,
  onEditar,
  onDesvincular,
  buscaPorItem,
  onBuscarItem,
}: Props) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="text-left py-2 px-1 text-[var(--text3)] text-[10px] uppercase tracking-wide w-6">#</th>
              <th className="text-left py-2 px-2 text-[var(--text3)] text-[10px] uppercase tracking-wide">Descricao</th>
              <th className="text-left py-2 px-2 text-[var(--text3)] text-[10px] uppercase tracking-wide w-20">Qtd</th>
              <th className="text-left py-2 px-2 text-[var(--text3)] text-[10px] uppercase tracking-wide w-24">Custo Unit.</th>
              <th className="text-left py-2 px-2 text-[var(--text3)] text-[10px] uppercase tracking-wide w-16">Total</th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => {
              const total = item.qtd * item.custoUnit
              return (
                <tr key={item.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 px-1 text-[var(--text3)] text-xs">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <ProdutoCombobox
                      valorBusca={item.produtoVinculado ? item.produtoVinculado.nome : (buscaPorItem[item.id] ?? item.descricao)}
                      produtoVinculado={item.produtoVinculado}
                      editando={item.produtoEditando}
                      onBuscar={(texto) => {
                        onBuscarItem(item.id, texto)
                        onAtualizar(item.id, 'descricao', texto)
                      }}
                      onSelecionar={(p) => onSelecionarProduto(item.id, p)}
                      onCadastrarNovo={(nome) => onCadastrarNovo(item.id, nome)}
                      onUsarAvulso={(nome) => onUsarAvulso(item.id, nome)}
                      onEditar={() => onEditar(item.id)}
                      onDesvincular={() => onDesvincular(item.id)}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.qtd}
                      onChange={(e) => onAtualizar(item.id, 'qtd', parseFloat(e.target.value) || 0)}
                      style={{ background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px' }}
                      className="px-2 py-1.5 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.custoUnit ? fmt(item.custoUnit) : ''}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0
                        onAtualizar(item.id, 'custoUnit', v)
                      }}
                      placeholder="0,00"
                      style={{ background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px' }}
                      className="px-2 py-1.5 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
                    />
                  </td>
                  <td className="py-2 px-2 text-[var(--text)] text-xs whitespace-nowrap">
                    R$ {fmt(total)}
                  </td>
                  <td className="py-2 px-1">
                    <button
                      type="button"
                      onClick={() => onRemover(item.id)}
                      className="text-[var(--red)] hover:opacity-70"
                      aria-label="Remover item"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAdicionar}
        className="mt-3 text-[var(--green)] text-sm flex items-center gap-1 hover:underline"
      >
        + Adicionar item
      </button>
    </div>
  )
}
