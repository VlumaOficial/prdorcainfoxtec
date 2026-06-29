import type { ItemOrcamento } from '../hooks/useItensOrcamento'
import type { Produto } from '../hooks/useProdutos'
import type { CSSProperties } from 'react'
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

const chkBoxStyle: CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  fontSize: '11px',
}

function ChkToggle({ marcado, onToggle, titulo }: { marcado: boolean; onToggle: () => void; titulo: string }) {
  return (
    <div
      onClick={onToggle}
      title={titulo}
      style={{
        ...chkBoxStyle,
        background: marcado ? 'var(--green)' : 'var(--navy4)',
        border: marcado ? '1.5px solid var(--green)' : '1.5px solid var(--border2)',
      }}
    >
      {marcado && <span style={{ color: '#fff' }}>✓</span>}
    </div>
  )
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
        <table className="w-full text-sm min-w-[920px]">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: 'var(--border)' }}>
              <th style={{ width: '28px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2">#</th>
              <th style={{ minWidth: '160px', width: '30%' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2">Descricao</th>
              <th style={{ width: '72px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2 text-center">Qtd</th>
              <th style={{ width: '90px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2">Custo Unit.</th>
              <th style={{ width: '120px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2 text-center">Imp - Marg - Desc</th>
              <th style={{ width: '88px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2">Custo Total</th>
              <th style={{ width: '88px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2">Preco Tabela</th>
              <th style={{ width: '80px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2">Desconto</th>
              <th style={{ width: '88px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2">C/ Imposto</th>
              <th style={{ width: '76px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2">Lucro</th>
              <th style={{ width: '90px' }} className="text-[var(--text3)] text-[10px] uppercase tracking-wide py-2 px-2">Total</th>
              <th style={{ width: '28px' }}></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => {
              const custoTotal = item.qtd * item.custoUnit
              const margPct = item.usaMargGlobal ? 0 : item.margPct
              const margemRS = custoTotal * (margPct / 100)
              const baseAntesImposto = custoTotal + margemRS
              const impPct = item.usaImpGlobal ? 0 : item.impPct
              const precoTabela = impPct > 0 ? baseAntesImposto / (1 - impPct / 100) : baseAntesImposto
              let descVal = 0
              if (!item.usaDescGlobal) {
                descVal = item.descFix > 0 ? Math.min(item.descFix, precoTabela) : precoTabela * (item.descPct / 100)
              }
              const total = precoTabela - descVal
              const comImposto = total * (impPct / 100)
              const lucro = total - comImposto - custoTotal

              return (
                <tr key={item.id} className="border-b align-top" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 text-[var(--text3)] text-[11px] text-center" style={{ fontFamily: 'var(--mono)' }}>{idx + 1}</td>
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
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onAtualizar(item.id, 'qtd', Math.max(0, item.qtd - 1))}
                        style={{ width: '22px', height: '28px', borderRadius: '5px', border: '1px solid var(--border2)', background: 'var(--navy4)', color: 'var(--text2)' }}
                        className="flex items-center justify-center hover:border-[var(--green)] hover:text-[var(--green)]"
                      >-</button>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.qtd}
                        onChange={(e) => onAtualizar(item.id, 'qtd', parseFloat(e.target.value) || 0)}
                        style={{ background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontFamily: 'var(--mono)', fontSize: '12px', width: '38px', textAlign: 'center', padding: '6px 2px' }}
                        className="outline-none focus:border-[var(--green)]"
                      />
                      <button
                        type="button"
                        onClick={() => onAtualizar(item.id, 'qtd', item.qtd + 1)}
                        style={{ width: '22px', height: '28px', borderRadius: '5px', border: '1px solid var(--border2)', background: 'var(--navy4)', color: 'var(--text2)' }}
                        className="flex items-center justify-center hover:border-[var(--green)] hover:text-[var(--green)]"
                      >+</button>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="relative">
                      <span className="absolute left-[7px] top-1/2 -translate-y-1/2 text-[11px] text-[var(--text3)] pointer-events-none" style={{ fontFamily: 'var(--mono)' }}>R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.custoUnit ? fmt(item.custoUnit) : ''}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0
                          onAtualizar(item.id, 'custoUnit', v)
                        }}
                        placeholder="0,00"
                        style={{ background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px', fontFamily: '"Inter", sans-serif', textAlign: 'right', paddingLeft: '26px' }}
                        className="py-1.5 pr-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <ChkToggle marcado={item.usaImpGlobal} onToggle={() => onAtualizar(item.id, 'usaImpGlobal', !item.usaImpGlobal)} titulo="Usar imposto global" />
                        <span className="text-[10px] text-[var(--text3)] uppercase">Imp</span>
                        {!item.usaImpGlobal && (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.impPct || ''}
                            onChange={(e) => onAtualizar(item.id, 'impPct', Math.min(99, parseFloat(e.target.value) || 0))}
                            placeholder="%"
                            style={{ width: '40px', background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px' }}
                            className="px-1 py-1 text-[var(--text)] outline-none focus:border-[var(--green)]"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <ChkToggle marcado={item.usaMargGlobal} onToggle={() => onAtualizar(item.id, 'usaMargGlobal', !item.usaMargGlobal)} titulo="Usar margem global" />
                        <span className="text-[10px] text-[var(--text3)] uppercase">Marg</span>
                        {!item.usaMargGlobal && (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.margPct || ''}
                            onChange={(e) => onAtualizar(item.id, 'margPct', Math.min(99, parseFloat(e.target.value) || 0))}
                            placeholder="%"
                            style={{ width: '40px', background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px' }}
                            className="px-1 py-1 text-[var(--text)] outline-none focus:border-[var(--green)]"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <ChkToggle marcado={item.usaDescGlobal} onToggle={() => onAtualizar(item.id, 'usaDescGlobal', !item.usaDescGlobal)} titulo="Usar desconto global" />
                        <span className="text-[10px] text-[var(--text3)] uppercase">Desc</span>
                        {!item.usaDescGlobal && (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.descPct || ''}
                            onChange={(e) => onAtualizar(item.id, 'descPct', Math.min(99, parseFloat(e.target.value) || 0))}
                            placeholder="%"
                            style={{ width: '40px', background: 'var(--navy3)', border: '1px solid transparent', borderRadius: '6px', fontSize: '12px' }}
                            className="px-1 py-1 text-[var(--text)] outline-none focus:border-[var(--green)]"
                          />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right text-[var(--text2)] text-xs whitespace-nowrap" style={{ fontFamily: 'var(--mono)' }}>{custoTotal > 0 ? fmt(custoTotal) : '\u2014'}</td>
                  <td className="py-2 px-2 text-right text-[var(--text2)] text-xs whitespace-nowrap" style={{ fontFamily: 'var(--mono)' }}>{custoTotal > 0 ? fmt(precoTabela) : '\u2014'}</td>
                  <td className="py-2 px-2 text-right text-[var(--purple)] text-xs whitespace-nowrap" style={{ fontFamily: 'var(--mono)' }}>{custoTotal > 0 ? fmt(descVal) : '\u2014'}</td>
                  <td className="py-2 px-2 text-right text-[var(--red)] text-xs whitespace-nowrap" style={{ fontFamily: 'var(--mono)' }}>{custoTotal > 0 ? fmt(comImposto) : '\u2014'}</td>
                  <td className="py-2 px-2 text-right text-[var(--amber)] text-xs whitespace-nowrap" style={{ fontFamily: 'var(--mono)' }}>{custoTotal > 0 ? (lucro < 0 ? '- ' + fmt(Math.abs(lucro)) : fmt(lucro)) : '\u2014'}</td>
                  <td className="py-2 px-2 text-right text-[var(--green)] font-semibold text-[13px] whitespace-nowrap" style={{ fontFamily: 'var(--mono)' }}>{custoTotal > 0 ? fmt(total) : '\u2014'}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => onRemover(item.id)}
                      className="text-[var(--text3)] hover:text-[var(--red)] hover:bg-[var(--red-dim)] rounded p-1 flex items-center"
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        className="mt-3 text-[var(--green)] text-sm flex items-center gap-1.5 hover:underline"
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Adicionar item
      </button>
    </div>
  )
}
