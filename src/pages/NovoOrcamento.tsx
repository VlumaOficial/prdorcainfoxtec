import { useState } from 'react'
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
  const {
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
  } = useNovoOrcamento()

  async function handleSalvar() {
    const id = await salvar({
      cabecalho,
      cliente,
      clienteVinculado,
      clienteAvulso,
      itens: itensState.itens,
      config: configState.config,
    })
    if (id) {
      setSalvoOk(true)
    }
  }

  const itensState = useItensOrcamento()
  const configState = useConfigGlobal()
  const { salvar, salvando, erro } = useSalvarOrcamento()
  const [salvoOk, setSalvoOk] = useState(false)

  return (
    <Layout>
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
            <SectionHeader color="g">Identificacao do Orcamento</SectionHeader>

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
                placeholder="Ex: Instalacao de sistema de monitoramento"
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
            <SectionHeader color="g">Observacoes e Condicoes</SectionHeader>

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                Condicoes de pagamento
              </label>
              <input
                type="text"
                value={cabecalho.condicoesPagamento}
                onChange={(e) => atualizarCampo('condicoesPagamento', e.target.value)}
                placeholder="50 por cento na aprovacao, 50 por cento na entrega"
                style={inputStyle}
                className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
                Observacoes gerais
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
          justifyContent: 'flex-end',
          gap: '16px',
          zIndex: 10,
        }}
      >
        {erro && (
          <span style={{ color: 'var(--red)', fontSize: '13px' }}>{erro}</span>
        )}
        {salvoOk && !erro && (
          <span style={{ color: 'var(--green)', fontSize: '13px', fontWeight: 600 }}>
            \u2713 Orcamento salvo com sucesso
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
          {salvando ? 'Salvando...' : 'Salvar Orcamento'}
        </button>
      </div>
    </Layout>
  )
}

