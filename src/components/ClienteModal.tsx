import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { Cliente } from '../hooks/useClientes'

interface Props {
  cliente: Cliente | null
  onClose: () => void
  onSave: (dados: {
    nome: string
    cnpj: string
    endereco: string
    responsavel: string
    email: string
    telefone: string
  }) => Promise<void>
}

export default function ClienteModal({ cliente, onClose, onSave }: Props) {
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [endereco, setEndereco] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome || '')
      setCnpj(cliente.cnpj || '')
      setEndereco(cliente.endereco || '')
      setResponsavel(cliente.responsavel || '')
      setEmail(cliente.email || '')
      setTelefone(cliente.telefone || '')
    }
  }, [cliente])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await onSave({ nome, cnpj, endereco, responsavel, email, telefone })
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
          {cliente ? 'Editar cliente' : 'Novo cliente'}
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
            CNPJ
          </label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-3 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />

          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Endereço
          </label>
          <input
            type="text"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-3 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />

          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Responsável
          </label>
          <input
            type="text"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-3 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />

          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-3 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />

          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Telefone
          </label>
          <input
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
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
