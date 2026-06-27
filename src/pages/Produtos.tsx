import { useState, useMemo } from 'react'
import Layout from '../components/Layout'
import ProdutoModal from '../components/ProdutoModal'
import { useProdutos } from '../hooks/useProdutos'
import type { Produto, FiltroStatus } from '../hooks/useProdutos'

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Produtos() {
  const [filtro, setFiltro] = useState<FiltroStatus>('ativos')
  const { produtos, carregando, criar, atualizar, inativar, reativar } = useProdutos(filtro)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return produtos
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo))
  }, [produtos, busca])

  function abrirNovo() {
    setProdutoEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(produto: Produto) {
    setProdutoEditando(produto)
    setModalAberto(true)
  }

  async function handleSave(dados: { nome: string; descricao: string; custo_padrao: number }) {
    if (produtoEditando) {
      await atualizar(produtoEditando.id, dados)
    } else {
      await criar(dados)
    }
  }

  async function handleInativar(id: string) {
    if (confirm('Tem certeza que deseja inativar este produto?')) {
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
            Produtos
          </h1>
          <p className="text-[var(--text2)] text-sm">
            {produtos.length} produto{produtos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md px-4 py-2.5 font-semibold text-sm whitespace-nowrap"
        >
          + Novo Produto
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
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

      {/* Tabela — desktop */}
      <div className="hidden md:block bg-[var(--navy2)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Nome</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Descrição</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Custo padrão</th>
              <th className="px-4 py-3 text-[var(--text3)] text-xs uppercase tracking-wide">Status</th>
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

            {!carregando && produtosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[var(--text2)]">
                  Nenhum produto encontrado
                </td>
              </tr>
            )}

            {produtosFiltrados.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[var(--text)]">{p.nome}</td>
                <td className="px-4 py-3 text-[var(--text2)] max-w-xs truncate">{p.descricao || '—'}</td>
                <td className="px-4 py-3 text-[var(--text)]">{formatarMoeda(p.custo_padrao)}</td>
                <td className="px-4 py-3">
                  {p.ativo ? (
                    <span className="text-[var(--green)] text-xs bg-[var(--green-dim)] px-2 py-0.5 rounded-full">Ativo</span>
                  ) : (
                    <span className="text-[var(--text3)] text-xs bg-[var(--navy4)] px-2 py-0.5 rounded-full">Inativo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => abrirEdicao(p)} className="text-[var(--blue)] text-xs mr-3 hover:underline">
                    Editar
                  </button>
                  {p.ativo ? (
                    <button onClick={() => handleInativar(p.id)} className="text-[var(--red)] text-xs hover:underline">
                      Inativar
                    </button>
                  ) : (
                    <button onClick={() => handleReativar(p.id)} className="text-[var(--green)] text-xs hover:underline">
                      Reativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {carregando && (
          <p className="text-center text-[var(--text2)] py-6">Carregando...</p>
        )}

        {!carregando && produtosFiltrados.length === 0 && (
          <p className="text-center text-[var(--text2)] py-6">Nenhum produto encontrado</p>
        )}

        {produtosFiltrados.map((p) => (
          <div key={p.id} className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[var(--text)] font-medium">{p.nome}</h3>
              {p.ativo ? (
                <span className="text-[var(--green)] text-xs bg-[var(--green-dim)] px-2 py-0.5 rounded-full whitespace-nowrap">Ativo</span>
              ) : (
                <span className="text-[var(--text3)] text-xs bg-[var(--navy4)] px-2 py-0.5 rounded-full whitespace-nowrap">Inativo</span>
              )}
            </div>
            <p className="text-[var(--text2)] text-sm mb-1">{p.descricao || 'Sem descrição'}</p>
            <p className="text-[var(--text)] font-medium mb-3">{formatarMoeda(p.custo_padrao)}</p>
            <div className="flex gap-4 pt-2 border-t border-[var(--border)]">
              <button onClick={() => abrirEdicao(p)} className="text-[var(--blue)] text-sm">
                Editar
              </button>
              {p.ativo ? (
                <button onClick={() => handleInativar(p.id)} className="text-[var(--red)] text-sm">
                  Inativar
                </button>
              ) : (
                <button onClick={() => handleReativar(p.id)} className="text-[var(--green)] text-sm">
                  Reativar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <ProdutoModal
          produto={produtoEditando}
          onClose={() => setModalAberto(false)}
          onSave={handleSave}
        />
      )}
    </Layout>
  )
}
