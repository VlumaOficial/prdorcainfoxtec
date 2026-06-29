import { useState, useRef, useEffect } from 'react'
import { useClientes } from '../hooks/useClientes'
import type { Cliente } from '../hooks/useClientes'

interface Props {
  valorBusca: string
  clienteVinculado: Cliente | null
  editando: boolean
  onBuscar: (texto: string) => void
  onSelecionar: (cliente: Cliente) => void
  onCadastrarNovo: (nome: string) => void
  onUsarAvulso: (nome: string) => void
  onDesvincular: () => void
  onEditar: () => void
}

const inputStyle = {
  background: 'var(--navy3)',
  border: '1px solid var(--border2)',
  borderRadius: '8px',
  fontFamily: '"Inter", sans-serif',
  fontSize: '13px',
}

export default function ClienteCombobox({
  valorBusca,
  clienteVinculado,
  editando,
  onBuscar,
  onSelecionar,
  onCadastrarNovo,
  onUsarAvulso,
  onDesvincular,
  onEditar,
}: Props) {
  const { clientes } = useClientes('ativos')
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const resultados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(valorBusca.toLowerCase())
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
    if (confirm('Deseja trocar o cliente selecionado? Os dados preenchidos serao limpos.')) {
      onDesvincular()
    }
  }

  if (clienteVinculado && !editando) {
    return (
      <div className="flex items-center justify-between gap-2" style={{ ...inputStyle }}>
        <span className="px-[11px] py-2 text-[var(--text)] truncate">
          {clienteVinculado.nome}
        </span>
        <div className="flex gap-1 pr-2">
          <button
            type="button"
            onClick={onEditar}
            className="text-[var(--green)] text-xs px-2 py-1 hover:underline whitespace-nowrap"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleTrocar}
            className="text-[var(--blue)] text-xs px-2 py-1 hover:underline whitespace-nowrap"
          >
            Trocar
          </button>
        </div>
      </div>
    )
  }

  if (clienteVinculado && editando) {
    return (
      <div className="flex items-center justify-between gap-2" style={{ ...inputStyle, borderColor: 'var(--green)' }}>
        <span className="px-[11px] py-2 text-[var(--text)] truncate">
          Editando: {clienteVinculado.nome}
        </span>
        <button
          type="button"
          onClick={handleTrocar}
          className="text-[var(--blue)] text-xs px-3 hover:underline whitespace-nowrap"
        >
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
        placeholder="Buscar cliente por nome..."
        style={inputStyle}
        className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
      />

      {aberto && valorBusca.trim().length > 0 && (
        <div
          className="absolute z-20 w-full mt-1 rounded-lg overflow-hidden max-h-60 overflow-y-auto"
          style={{ background: 'var(--navy4)', border: '1px solid var(--border2)' }}
        >
          {resultados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelecionar(c)
                setAberto(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--navy3)] transition-colors"
            >
              {c.nome}
              {c.cnpj && (
                <span className="text-[var(--text3)] text-xs ml-2">{c.cnpj}</span>
              )}
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
                  Cadastrar como cliente
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
