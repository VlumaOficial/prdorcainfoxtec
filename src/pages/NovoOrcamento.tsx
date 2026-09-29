import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import Layout from '../components/Layout'
import EmitCard from '../components/EmitCard'
import ClienteSection from '../components/ClienteSection'
import ItensTable from '../components/ItensTable'
import { useItensOrcamento } from '../hooks/useItensOrcamento'
import ConfiguracoesSidebar from '../components/ConfiguracoesSidebar'
import ResumoSidebar from '../components/ResumoSidebar'
import { useConfigGlobal } from '../hooks/useConfigGlobal'
import { useNovoOrcamento } from '../hooks/useNovoOrcamento'
import { useSalvarOrcamento } from '../hooks/useSalvarOrcamento'
import { carregarOrcamento } from '../hooks/useCarregarOrcamento'
import StatusActions from '../components/StatusActions'
import ModalDivergencias from '../components/ModalDivergencias'
import SelecaoItensPedido from '../components/SelecaoItensPedido'
import BannerRascunho from '../components/BannerRascunho'
import { useRascunhoLocal } from '../hooks/useRascunhoLocal'
import type { RascunhoOrcamentoV1 } from '../hooks/useRascunhoLocal'
import { detectarDivergencias } from '../lib/detectarDivergencias'
import type { Divergencia } from '../lib/detectarDivergencias'
import { gerarPdf } from '../lib/gerarPdf'
import { supabase } from '../lib/supabase'
import logoInfoxtec from '../assets/infoxtec-logo.jpeg'

const sectionStyle: CSSProperties = {
  background: 'var(--navy2)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '1.25rem 1.5rem',
}

const inputStyle: CSSProperties = {
  background: 'var(--navy3)',
  border: '1px solid var(--border2)',
  borderRadius: '8px',
  fontFamily: '"Inter", sans-serif',
  fontSize: '13px',
}

function SectionHeader({ children, color }: { children: ReactNode; color: 'g' | 'b' }) {
  const bg = color === 'g' ? 'var(--green-dim)' : 'var(--blue-dim)'
  const fg = color === 'g' ? 'var(--green)' : 'var(--blue)'
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center flex-shrink-0"
        style={{ background: bg, color: fg }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <span className="font-sora font-semibold text-[13px] text-[var(--text)]">
        {children}
      </span>
    </div>
  )
}

export default function NovoOrcamento() {
  const { id: orcamentoId } = useParams<{ id: string }>()
  const modoEdicao = Boolean(orcamentoId)
  const navigate = useNavigate()
  const {
    carregar: carregarCabecalhoCliente,
    cabecalho,
    atualizarCampo,
    cliente,
    atualizarCliente,
    clienteVinculado,
    clienteBusca,
    setClienteBusca,
    clienteAvulso,
    clienteEditando,
    editarClienteVinculado,
    selecionarClienteExistente,
    cadastrarClienteNovo,
    usarClienteAvulso,
    desvincularCliente,
    carregandoNumero,
  } = useNovoOrcamento(modoEdicao)

  function montarDados() {
    return {
      cabecalho,
      cliente,
      clienteVinculado,
      clienteAvulso,
      itens: itensState.itens,
      config: configState.config,
    }
  }

  async function executarSalvamento() {
    const dados = montarDados()
    if (modoEdicao && orcamentoId) {
      const id = await atualizar(orcamentoId, dados, statusAtual)
      if (id) {
        limparRascunho()
        setSalvoOk(true)
        setTimeout(() => setSalvoOk(false), 3000)
      }
      return id
    }
    const id = await salvar(dados)
    if (id) {
      limparRascunho()
      // Navega pra rota de edicao do orcamento recem-criado: sem isso, a tela ficava presa
      // em /orcamentos/novo sem nenhum botao de salvar pra continuar editando.
      navigate('/orcamentos/' + id, { replace: true })
    }
    return id
  }

  async function handleSalvar() {
    // Em modo edicao, detecta divergencias com o catalogo antes de salvar
    if (modoEdicao) {
      const divs = detectarDivergencias(itensState.itens, cliente, clienteVinculado)
      if (divs.length > 0) {
        setDivergencias(divs)
        setModalAberto(true)
        return
      }
    }
    await executarSalvamento()
  }

  async function handleModalAtualizarCatalogo() {
    await atualizarCatalogo(divergencias)
    setModalAberto(false)
    await executarSalvamento()
  }

  async function handleModalSoNesteOrcamento() {
    setModalAberto(false)
    await executarSalvamento()
  }

  async function handleMudarStatus(novo: string) {
    if (!orcamentoId) return
    const ok = await mudarStatus(orcamentoId, novo)
    if (ok) {
      setStatusAtual(novo)
      // Ao aprovar, abre direto a selecao de itens para gerar o primeiro pedido
      if (novo === 'aprovado') setSelecaoPedidoAberta(true)
    }
  }

  async function handleCancelarOrcamento() {
    if (!orcamentoId) return
    if (!confirm('Cancelar este orçamento? Pedidos vinculados ainda não faturados também serão cancelados.')) return
    if (await cancelarOrcamento(orcamentoId)) setStatusAtual('cancelado')
  }

  async function verificarItensDisponiveis() {
    if (!orcamentoId) return
    const { data } = await supabase.rpc('itens_disponiveis_orcamento', { p_orcamento_id: orcamentoId })
    setItensDisponiveis((data || []).length)
  }

  function handlePedidoCriado(pedidoId: string) {
    setSelecaoPedidoAberta(false)
    navigate('/pedidos/' + pedidoId)
  }

  async function handleGerarPdf() {
    // Converte o logo (asset) para base64 para embutir no PDF
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
      cabecalho,
      cliente,
      itens: itensState.itens,
      config: configState.config,
      logoBase64,
    })
  }

  const itensState = useItensOrcamento()
  const configState = useConfigGlobal()
  const { salvar, atualizar, mudarStatus, cancelarOrcamento, atualizarCatalogo, salvando, erro } = useSalvarOrcamento()
  const [salvoOk, setSalvoOk] = useState(false)
  const [divergencias, setDivergencias] = useState<Divergencia[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [statusAtual, setStatusAtual] = useState<string>('rascunho')
  const [carregandoEdicao, setCarregandoEdicao] = useState(modoEdicao)
  const [selecaoPedidoAberta, setSelecaoPedidoAberta] = useState(false)
  const [itensDisponiveis, setItensDisponiveis] = useState(0)
  const [temPedidos, setTemPedidos] = useState(false)

  // Rascunho local (Fase A) — ver docs/RASCUNHO_LOCAL.md. Chave por contexto: uma pro
  // formulario de criacao, uma por orcamento em edicao.
  const chaveRascunho = modoEdicao && orcamentoId ? `orcamento_rascunho_editar_${orcamentoId}` : 'orcamento_rascunho_novo'
  const { agendarSalvar, carregarRascunho, limparRascunho } = useRascunhoLocal(chaveRascunho)
  const [rascunhoDisponivel, setRascunhoDisponivel] = useState<RascunhoOrcamentoV1 | null>(null)
  const [draftVerificado, setDraftVerificado] = useState(false)

  function handleRestaurarRascunho() {
    if (!rascunhoDisponivel) return
    const d = rascunhoDisponivel.dados
    carregarCabecalhoCliente(d.cabecalho, d.cliente, d.clienteVinculado, d.clienteAvulso)
    itensState.carregar(d.itens)
    configState.carregar(d.config)
    setRascunhoDisponivel(null)
    setDraftVerificado(true)
  }

  function handleDescartarRascunho() {
    limparRascunho()
    setRascunhoDisponivel(null)
    setDraftVerificado(true)
  }

  useEffect(() => {
    if (!orcamentoId) return
    let ativo = true
    async function carregar() {
      const dados = await carregarOrcamento(orcamentoId!)
      if (!ativo) return
      if (dados) {
        carregarCabecalhoCliente(dados.cabecalho, dados.cliente, dados.clienteVinculado, dados.clienteAvulso)
        itensState.carregar(dados.itens)
        configState.carregar(dados.config)
        setStatusAtual(dados.status)
      }
      setCarregandoEdicao(false)
    }
    async function verificarPedidosVinculados() {
      const { data } = await supabase.from('pedidos').select('id').eq('orcamento_id', orcamentoId).limit(1)
      if (ativo) setTemPedidos((data || []).length > 0)
    }
    carregar()
    verificarPedidosVinculados()
    return () => { ativo = false }
  }, [orcamentoId])

  // Enquanto o orcamento estiver aprovado, verifica se ha itens sem pedido vinculado
  // (mostra o botao "Novo Pedido (itens restantes)" quando houver).
  useEffect(() => {
    if (orcamentoId && statusAtual === 'aprovado') verificarItensDisponiveis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcamentoId, statusAtual, selecaoPedidoAberta])

  // Verifica se ha um rascunho local nao salvo pra este contexto (criacao ou este orcamento
  // especifico). So oferece — nunca restaura sozinho, pra nao sobrescrever um comeco novo.
  useEffect(() => {
    setRascunhoDisponivel(null)
    setDraftVerificado(false)
    const r = carregarRascunho()
    if (r) {
      setRascunhoDisponivel(r)
    } else {
      setDraftVerificado(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveRascunho])

  // Rastreia mudancas no formulario e agenda o salvamento local (debounced). So comeca depois
  // que a oferta de rascunho anterior foi resolvida (restaurada ou descartada), senao um save
  // automatico no meio do caminho sobrescreveria o rascunho antes do usuario decidir.
  useEffect(() => {
    if (!draftVerificado) return
    agendarSalvar({
      cabecalho,
      cliente,
      clienteVinculado,
      clienteAvulso,
      itens: itensState.itens,
      config: configState.config,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftVerificado, cabecalho, cliente, clienteVinculado, clienteAvulso, itensState.itens, configState.config])

  if (carregandoEdicao) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20 text-[var(--text2)]">
          Carregando orçamento...
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {rascunhoDisponivel && (
        <BannerRascunho
          atualizadoEm={rascunhoDisponivel.atualizadoEm}
          onRestaurar={handleRestaurarRascunho}
          onDescartar={handleDescartarRascunho}
        />
      )}
      {modoEdicao && (
        <div className="mb-4 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ background: 'var(--navy2)', border: '1px solid var(--border)' }}>
          <StatusActions
            status={statusAtual as 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'expirado' | 'cancelado'}
            desabilitado={salvando}
            onMudar={handleMudarStatus}
            onCancelar={handleCancelarOrcamento}
          />
          <div className="flex items-center gap-2">
            {statusAtual === 'aprovado' && itensDisponiveis > 0 && (
              <button
                type="button"
                onClick={() => setSelecaoPedidoAberta(true)}
                className="rounded-md px-4 py-2 font-semibold text-sm whitespace-nowrap"
                style={{ background: 'transparent', color: 'var(--blue)', border: '1px solid var(--blue)' }}
              >
                Novo Pedido (itens restantes)
              </button>
            )}
            <button
              type="button"
              onClick={handleGerarPdf}
              className="bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md px-4 py-2 font-semibold text-sm whitespace-nowrap"
            >
              Gerar PDF
            </button>
          </div>
        </div>
      )}
      <EmitCard
        emailContato={cabecalho.emailContato}
        telefoneContato={cabecalho.telefoneContato}
        onChangeEmail={(v) => atualizarCampo('emailContato', v)}
        onChangeTelefone={(v) => atualizarCampo('telefoneContato', v)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-7">
        <div className="flex flex-col gap-5 min-w-0">
          <ClienteSection
            nome={cliente.nome}
            cnpj={cliente.cnpj}
            endereco={cliente.endereco}
            responsavel={cliente.responsavel}
            emailTelefone={cliente.emailTelefone}
            onChange={atualizarCliente}
            clienteVinculado={clienteVinculado}
            clienteAvulso={clienteAvulso}
            clienteEditando={clienteEditando}
            onEditar={editarClienteVinculado}
            clienteBusca={clienteBusca}
            onBuscar={setClienteBusca}
            onSelecionar={selecionarClienteExistente}
            onCadastrarNovo={cadastrarClienteNovo}
            onUsarAvulso={usarClienteAvulso}
            onDesvincular={desvincularCliente}
          />

          <div style={sectionStyle}>
            <SectionHeader color="g">Identificação do Orçamento</SectionHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                  Numero
                </label>
                <input
                  type="text"
                  value={carregandoNumero ? '...' : cabecalho.numero}
                  onChange={(e) => atualizarCampo('numero', e.target.value)}
                  style={inputStyle}
                  className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                  Data de emissao
                </label>
                <input
                  type="date"
                  value={cabecalho.dataEmissao}
                  onChange={(e) => atualizarCampo('dataEmissao', e.target.value)}
                  style={inputStyle}
                  className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                  Valido ate
                </label>
                <input
                  type="date"
                  value={cabecalho.validade}
                  onChange={(e) => atualizarCampo('validade', e.target.value)}
                  style={inputStyle}
                  className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                Titulo / Objeto
              </label>
              <input
                type="text"
                value={cabecalho.titulo}
                onChange={(e) => atualizarCampo('titulo', e.target.value)}
                placeholder="Ex: Instalação de sistema de monitoramento"
                style={inputStyle}
                className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
              />
            </div>
          </div>

          <div style={sectionStyle}>
            <SectionHeader color="g">Itens / Servicos</SectionHeader>
            <ItensTable
              config={configState.config}
              itens={itensState.itens}
              bloqueado={temPedidos}
              buscaPorItem={itensState.buscaPorItem}
              onAdicionar={itensState.adicionarItem}
              onRemover={itensState.removerItem}
              onAtualizar={itensState.atualizarItem}
              onBuscarItem={itensState.buscarItem}
              onSelecionarProduto={itensState.selecionarProduto}
              onCadastrarNovo={itensState.cadastrarProdutoNovo}
              onUsarAvulso={itensState.usarProdutoAvulso}
              onEditar={itensState.editarProdutoVinculado}
              onDesvincular={itensState.desvincularProduto}
            />
          </div>

          <div style={sectionStyle}>
            <SectionHeader color="g">Observações e Condições</SectionHeader>

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                Condicoes de pagamento
              </label>
              <input
                type="text"
                value={cabecalho.condicoesPagamento}
                onChange={(e) => atualizarCampo('condicoesPagamento', e.target.value)}
                placeholder="50 por cento na aprovação, 50 por cento na entrega"
                style={inputStyle}
                className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                Observações gerais
              </label>
              <textarea
                value={cabecalho.observacoesGerais}
                onChange={(e) => atualizarCampo('observacoesGerais', e.target.value)}
                rows={3}
                placeholder="Prazo de execucao, garantia, informacoes adicionais"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '68px' }}
                className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
              />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 self-start flex flex-col gap-5">
          <ConfiguracoesSidebar
            config={configState.config}
            onAtualizar={configState.atualizar}
          />

          <ResumoSidebar
            itens={itensState.itens}
            config={configState.config}
          />
        </div>
      </div>

      {/* Barra de acoes */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          marginTop: '24px',
          padding: '16px 0',
          background: 'var(--navy)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/orcamentos')}
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

        <div className="flex items-center gap-4">
          {erro && (
            <span style={{ color: 'var(--red)', fontSize: '13px' }}>{erro}</span>
          )}
          {salvoOk && !erro && (
            <span style={{ color: 'var(--green)', fontSize: '13px', fontWeight: 600 }}>
              &#10003; Orçamento salvo com sucesso
            </span>
          )}

          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            style={{
              background: 'var(--green)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 24px',
              borderRadius: '8px',
              cursor: salvando ? 'not-allowed' : 'pointer',
              opacity: salvando ? 0.6 : 1,
              border: 'none',
            }}
          >
            {salvando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Salvar Orçamento'}
          </button>
        </div>
      </div>

      {modalAberto && (
        <ModalDivergencias
          divergencias={divergencias}
          processando={salvando}
          onAtualizarCatalogo={handleModalAtualizarCatalogo}
          onSoNesteOrcamento={handleModalSoNesteOrcamento}
          onCancelar={() => setModalAberto(false)}
        />
      )}

      {selecaoPedidoAberta && orcamentoId && (
        <SelecaoItensPedido
          orcamentoId={orcamentoId}
          onCriado={handlePedidoCriado}
          onCancelar={() => setSelecaoPedidoAberta(false)}
        />
      )}
    </Layout>
  )
}

