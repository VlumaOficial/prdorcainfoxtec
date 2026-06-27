import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import ClienteModal from '../components/ClienteModal'
import { useClientes } from '../hooks/useClientes'
import type { Cliente } from '../hooks/useClientes'

export default function Clientes() {
  const { clientes, carregando, criar, atualizar, inativar } = useClientes()
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.cnpj ?? '').toLowerCase().includes(termo)
    )
  }, [clientes, busca])

  function abrirNovo() {
    setClienteEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEditando(cliente)
    setModalAberto(true)
  }

  async function handleSave(dados: {
    nome: string
    cnpj: string
    endereco: string
    responsavel: string
    email: string
    telefone: string
  }) {
    if (clienteEditando) {
      await atualizar(clienteEditando.id, dados)
    } else {
      await criar(dados)
    }
  }

  async function handleInativar(id: string) {
    if (confirm('Tem certeza que deseja inativar este cliente?')) {
      await inativar(id)
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[var(--text)] text-2xl font-semibold mb-1">
            Clientes
          </h1>
          <p className="text-[var(--text2)] text-sm">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md px-4 py-2.5 font-semibold text-sm"
        >
          + Novo Cliente
        </button>
      </div>

      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou CNPJ..."
        className="w-full max-w-md bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 mb-5 text-[var(--text)] outline-none focus:border-[var(--green)]"
      />

      <div className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Nome</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">CNPJ</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Responsável</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--text2)]">
                  Carregando...
                </td>
              </tr>
            )}

            {!carregando && clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--text2)]">
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}

            {clientesFiltrados.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[var(--text)]">{c.nome}</td>
                <td className="px-4 py-3 text-[var(--text2)]">{c.cnpj || '—'}</td>
                <td className="px-4 py-3 text-[var(--text2)]">{c.responsavel || '—'}</td>
                <td className="px-4 py-3 text-[var(--text2)]">{c.email || '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => abrirEdicao(c)}
                    className="text-[var(--blue)] text-xs mr-3 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleInativar(c.id)}
                    className="text-[var(--red)] text-xs hover:underline"
                  >
                    Inativar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <ClienteModal
          cliente={clienteEditando}
          onClose={() => setModalAberto(false)}
          onSave={handleSave}
        />
      )}
    </Layout>
  )
}
