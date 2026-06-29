import { useState, useRef, useEffect } from 'react'
import { useProdutos } from '../hooks/useProdutos'
import type { Produto } from '../hooks/useProdutos'

interface Props {
  valorBusca: string
  produtoVinculado: Produto | null
  editando: boolean
  onBuscar: (texto: string) => void
  onSelecionar: (produto: Produto) => void
  onCadastrarNovo: (nome: string) => void
  onUsarAvulso: (nome: string) => void
  onDesvincular: () => void
  onEditar: () => void
}

const inputStyle = {
  background: 'var(--navy3)',
  border: '1px solid transparent',
  borderRadius: '6px',
  fontFamily: '"Inter", sans-serif',
  fontSize: '12px',
}

export default function ProdutoCombobox({
  valorBusca,
  produtoVinculado,
  editando,
  onBuscar,
  onSelecionar,
  onCadastrarNovo,
  onUsarAvulso,
  onDesvincular,
  onEditar,
}: Props) {
  const { produtos } = useProdutos('ativos')
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const resultados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(valorBusca.toLowerCase())
  )

  const naoEncontrou = valorBusca.trim().length > 0 && resultados.length === 0

  useEffect(() => {
    function fecharAoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fecharAoClicarFora)
    return () => document.removeEventListener('mousedown', fecharAoClicarFora)
  }, [])

  function handleTrocar() {
    if (confirm('Deseja trocar o produto deste item?')) {
      onDesvincular()
    }
  }

  if (produtoVinculado && !editando) {
    return (
      <div className="flex items-center justify-between gap-1" style={inputStyle}>
        <span className="px-2 py-1.5 text-[var(--text)] truncate text-xs">
          {produtoVinculado.nome}
        </span>
        <div className="flex gap-1 pr-1">
          <button type="button" onClick={onEditar} className="text-[var(--green)] text-[10px] hover:underline whitespace-nowrap">
            Editar
          </button>
          <button type="button" onClick={handleTrocar} className="text-[var(--blue)] text-[10px] hover:underline whitespace-nowrap">
            Trocar
          </button>
        </div>
      </div>
    )
  }

  if (produtoVinculado && editando) {
    return (
      <div className="flex items-center justify-between gap-1" style={{ ...inputStyle, borderColor: 'var(--green)' }}>
        <span className="px-2 py-1.5 text-[var(--text)] truncate text-xs">
          Editando: {produtoVinculado.nome}
        </span>
        <button type="button" onClick={handleTrocar} className="text-[var(--blue)] text-[10px] pr-2 hover:underline whitespace-nowrap">
          Trocar
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={valorBusca}
        onChange={(e) => {
          onBuscar(e.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        placeholder="Descricao do item / servico"
        style={inputStyle}
        className="px-2 py-1.5 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
      />

      {aberto && valorBusca.trim().length > 0 && (
        <div
          className="absolute z-20 w-full mt-1 rounded-lg overflow-hidden max-h-60 overflow-y-auto"
          style={{ background: 'var(--navy4)', border: '1px solid var(--border2)' }}
        >
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelecionar(p)
                setAberto(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--navy3)] transition-colors"
            >
              {p.nome}
              <span className="text-[var(--text3)] text-xs ml-2">
                R$ {p.custo_padrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </button>
          ))}

          {naoEncontrou && (
            <div className="p-3">
              <p className="text-[var(--text2)] text-xs mb-2">
                "{valorBusca}" nao esta no catalogo.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCadastrarNovo(valorBusca)
                    setAberto(false)
                  }}
                  className="flex-1 bg-[var(--green-dim)] text-[var(--green)] text-xs rounded-md py-1.5 font-medium"
                >
                  Cadastrar como produto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUsarAvulso(valorBusca)
                    setAberto(false)
                  }}
                  className="flex-1 bg-[var(--navy3)] text-[var(--text2)] text-xs rounded-md py-1.5 font-medium"
                >
                  Usar so neste orcamento
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
