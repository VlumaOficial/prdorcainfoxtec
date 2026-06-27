import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { Produto } from '../hooks/useProdutos'

interface Props {
  produto: Produto | null
  onClose: () => void
  onSave: (dados: { nome: string; descricao: string; custo_padrao: number }) => Promise<void>
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseMoeda(valor: string) {
  const limpo = valor.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(limpo) || 0
}

export default function ProdutoModal({ produto, onClose, onSave }: Props) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [custoTexto, setCustoTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (produto) {
      setNome(produto.nome || '')
      setDescricao(produto.descricao || '')
      setCustoTexto(formatarMoeda(produto.custo_padrao || 0))
    }
  }, [produto])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')

    const custo_padrao = parseMoeda(custoTexto)

    if (custo_padrao <= 0) {
      setErro('Informe um custo padrão maior que zero.')
      return
    }

    setSalvando(true)
    try {
      await onSave({ nome, descricao, custo_padrao })
      onClose()
    } catch (e) {
      setErro(String(e))
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--navy2)] border border-[var(--border2)] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-[var(--text)] text-lg font-semibold mb-5">
          {produto ? 'Editar produto' : 'Novo produto'}
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Nome *
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-3 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />

          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-3 text-[var(--text)] outline-none focus:border-[var(--green)] resize-none"
          />

          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Custo padrão (R$) *
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={custoTexto}
            onChange={(e) => setCustoTexto(e.target.value)}
            placeholder="0,00"
            required
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-4 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />

          {erro && <p className="text-[var(--red)] text-sm mb-3">{erro}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[var(--border2)] text-[var(--text2)] rounded-md py-2.5 font-medium hover:bg-[var(--navy3)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md py-2.5 font-semibold disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
