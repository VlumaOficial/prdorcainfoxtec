import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import ClienteModal from '../components/ClienteModal'
import { useClientes } from '../hooks/useClientes'
import type { Cliente, FiltroStatus } from '../hooks/useClientes'

export default function Clientes() {
  const [filtro, setFiltro] = useState<FiltroStatus>('ativos')
  const { clientes, carregando, criar, atualizar, inativar, reativar } = useClientes(filtro)
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

  async function handleReativar(id: string) {
    await reativar(id)
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[var(--text)] text-2xl font-semibold mb-1">
            Clientes
          </h1>
          <p className="text-[var(--text2)] text-sm">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md px-4 py-2.5 font-semibold text-sm whitespace-nowrap"
        >
          + Novo Cliente
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou CNPJ..."
          className="flex-1 sm:max-w-md bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--green)]"
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as FiltroStatus)}
          className="bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--green)]"
        >
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Tabela — desktop (md e acima) */}
      <div className="hidden md:block bg-[var(--navy2)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Nome</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">CNPJ</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Responsável</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Endereço</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--text2)]">
                  Carregando...
                </td>
              </tr>
            )}

            {!carregando && clientesFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--text2)]">
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}

            {clientesFiltrados.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[var(--text)]">{c.nome}</td>
                <td className="px-4 py-3 text-[var(--text2)]">{c.cnpj || '—'}</td>
                <td className="px-4 py-3 text-[var(--text2)]">{c.responsavel || '—'}</td>
                <td className="px-4 py-3 text-[var(--text2)] max-w-[180px] truncate" title={c.endereco || ''}>{c.endereco || '—'}</td>
                <td className="px-4 py-3 text-[var(--text2)]">{c.email || '—'}</td>
                <td className="px-4 py-3">
                  {c.ativo ? (
                    <span className="text-[var(--green)] text-xs bg-[var(--green-dim)] px-2 py-0.5 rounded-full">Ativo</span>
                  ) : (
                    <span className="text-[var(--text3)] text-xs bg-[var(--navy4)] px-2 py-0.5 rounded-full">Inativo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => abrirEdicao(c)} className="text-[var(--blue)] text-xs mr-3 hover:underline">
                    Editar
                  </button>
                  {c.ativo ? (
                    <button onClick={() => handleInativar(c.id)} className="text-[var(--red)] text-xs hover:underline">
                      Inativar
                    </button>
                  ) : (
                    <button onClick={() => handleReativar(c.id)} className="text-[var(--green)] text-xs hover:underline">
                      Reativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile (abaixo de md) */}
      <div className="md:hidden flex flex-col gap-3">
        {carregando && (
          <p className="text-center text-[var(--text2)] py-6">Carregando...</p>
        )}

        {!carregando && clientesFiltrados.length === 0 && (
          <p className="text-center text-[var(--text2)] py-6">Nenhum cliente encontrado</p>
        )}

        {clientesFiltrados.map((c) => (
          <div key={c.id} className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[var(--text)] font-medium">{c.nome}</h3>
              {c.ativo ? (
                <span className="text-[var(--green)] text-xs bg-[var(--green-dim)] px-2 py-0.5 rounded-full whitespace-nowrap">Ativo</span>
              ) : (
                <span className="text-[var(--text3)] text-xs bg-[var(--navy4)] px-2 py-0.5 rounded-full whitespace-nowrap">Inativo</span>
              )}
            </div>
            <p className="text-[var(--text2)] text-sm mb-1">CNPJ: {c.cnpj || '—'}</p>
            <p className="text-[var(--text2)] text-sm mb-1">Responsável: {c.responsavel || '—'}</p>
            <p className="text-[var(--text2)] text-sm mb-1">Endereço: {c.endereco || '—'}</p>
            <p className="text-[var(--text2)] text-sm mb-3">Email: {c.email || '—'}</p>
            <div className="flex gap-4 pt-2 border-t border-[var(--border)]">
              <button onClick={() => abrirEdicao(c)} className="text-[var(--blue)] text-sm">
                Editar
              </button>
              {c.ativo ? (
                <button onClick={() => handleInativar(c.id)} className="text-[var(--red)] text-sm">
                  Inativar
                </button>
              ) : (
                <button onClick={() => handleReativar(c.id)} className="text-[var(--green)] text-sm">
                  Reativar
                </button>
              )}
            </div>
          </div>
        ))}
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
