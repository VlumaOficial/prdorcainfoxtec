import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import ResumoSidebar from '../components/ResumoSidebar'
import PedidoStatusActions from '../components/PedidoStatusActions'
import ModalFaturamento from '../components/ModalFaturamento'
import ConfiguracoesSidebarPedido from '../components/ConfiguracoesSidebarPedido'
import { carregarPedido } from '../hooks/useCarregarPedido'
import type { PedidoCompleto } from '../hooks/useCarregarPedido'
import { useAcoesPedido } from '../hooks/useAcoesPedido'
import type { DadosFaturamento } from '../hooks/useAcoesPedido'
import { useConfigGlobal } from '../hooks/useConfigGlobal'
import { calcularTotais } from '../lib/calculo'
import { gerarPdf } from '../lib/gerarPdf'
import { fmtBR } from '../lib/numeros'
import logoInfoxtec from '../assets/infoxtec-logo.jpeg'

export default function Pedido() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState<PedidoCompleto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [modalFaturamentoAberto, setModalFaturamentoAberto] = useState(false)
  const { cancelarPedido, marcarEntregue, marcarFaturado, salvando, erro } = useAcoesPedido()
  const configPdf = useConfigGlobal()

  async function carregar() {
    if (!id) return
    setCarregando(true)
    const dados = await carregarPedido(id)
    setPedido(dados)
    if (dados) configPdf.carregar(dados.config)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleEntregue() {
    if (!id) return
    if (await marcarEntregue(id)) await carregar()
  }

  async function handleCancelar() {
    if (!id || !pedido) return
    if (!confirm(`Cancelar o pedido ${pedido.numero}? Se este for o unico pedido ativo do orçamento ${pedido.orcamentoNumero}, o orçamento também será cancelado.`)) return
    if (await cancelarPedido(id)) await carregar()
  }

  async function handleFaturar(dados: DadosFaturamento) {
    if (!id) return
    if (await marcarFaturado(id, dados)) {
      setModalFaturamentoAberto(false)
      await carregar()
    }
  }

  async function handleGerarPdf() {
    if (!pedido) return
    let logoBase64: string | undefined
    try {
      const resp = await fetch(logoInfoxtec)
      const blob = await resp.blob()
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch {
      logoBase64 = undefined
    }
    gerarPdf({
      cabecalho: pedido.cabecalho,
      cliente: pedido.cliente,
      itens: pedido.itens,
      config: configPdf.config,
      logoBase64,
      tipoDocumento: 'PEDIDO',
    })
  }

  if (carregando) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20 text-[var(--text2)]">Carregando pedido...</div>
      </Layout>
    )
  }

  if (!pedido) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20 text-[var(--text2)]">Pedido nao encontrado.</div>
      </Layout>
    )
  }

  const totais = calcularTotais(pedido.itens, configPdf.config)

  return (
    <Layout>
      <div className="mb-4 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ background: 'var(--navy2)', border: '1px solid var(--border)' }}>
        <PedidoStatusActions
          status={pedido.status}
          desabilitado={salvando}
          onEntregue={handleEntregue}
          onFaturar={() => setModalFaturamentoAberto(true)}
          onCancelar={handleCancelar}
        />
        <button
          type="button"
          onClick={handleGerarPdf}
          className="bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md px-4 py-2 font-semibold text-sm whitespace-nowrap"
        >
          Gerar PDF
        </button>
      </div>

      {erro && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-7">
        <div className="flex flex-col gap-5 min-w-0">
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-sora font-semibold text-[13px] text-[var(--text)]">{pedido.numero}</h2>
              <Link to={'/orcamentos/' + pedido.orcamentoId} className="text-[var(--blue)] text-xs hover:underline">
                Ver orçamento de origem →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)] mb-1">Cliente</p>
                <p className="text-[var(--text)]">{pedido.cliente.nome || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)] mb-1">Título / Objeto</p>
                <p className="text-[var(--text)]">{pedido.cabecalho.titulo || '—'}</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
            <h2 className="font-sora font-semibold text-[13px] text-[var(--text)] mb-4">Itens deste pedido</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    <th className="py-2 text-[var(--text3)] text-xs uppercase tracking-wide">Descrição</th>
                    <th className="py-2 text-[var(--text3)] text-xs uppercase tracking-wide text-right">Qtd</th>
                    <th className="py-2 text-[var(--text3)] text-xs uppercase tracking-wide text-right">Custo Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.itens.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 text-[var(--text)]">{item.descricao}</td>
                      <td className="py-2 text-[var(--text2)] text-right">{item.qtd}</td>
                      <td className="py-2 text-[var(--text2)] text-right font-mono">{fmtBR(item.custoUnit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[var(--text)] font-semibold">Total: {fmtBR(totais.tFinal)}</span>
            </div>
          </div>

          {pedido.status === 'faturado' && (
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
              <h2 className="font-sora font-semibold text-[13px] text-[var(--text)] mb-4">Dados fiscais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)] mb-1">Nota Fiscal</p>
                  <p className="text-[var(--text)]">{pedido.numeroNf || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)] mb-1">Série</p>
                  <p className="text-[var(--text)]">{pedido.serieNf || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)] mb-1">Valor Faturado</p>
                  <p className="text-[var(--text)]">{pedido.valorFaturado != null ? fmtBR(pedido.valorFaturado) : '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6 self-start flex flex-col gap-5">
          <ConfiguracoesSidebarPedido config={configPdf.config} onAtualizar={configPdf.atualizar} />
          <ResumoSidebar itens={pedido.itens} config={configPdf.config} />
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <button
          type="button"
          onClick={() => navigate('/pedidos')}
          style={{
            background: 'transparent',
            color: 'var(--text2)',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            border: '1px solid var(--border2)',
          }}
        >
          &larr; Voltar
        </button>
      </div>

      {modalFaturamentoAberto && (
        <ModalFaturamento
          valorSugerido={totais.tFinal}
          processando={salvando}
          onConfirmar={handleFaturar}
          onCancelar={() => setModalFaturamentoAberto(false)}
        />
      )}
    </Layout>
  )
}
