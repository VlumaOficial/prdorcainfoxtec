import type { CSSProperties } from 'react'
import Layout from '../components/Layout'
import EmitCard from '../components/EmitCard'
import ClienteSection from '../components/ClienteSection'
import { useNovoOrcamento } from '../hooks/useNovoOrcamento'

const sectionStyle: CSSProperties = {
  background: 'var(--navy2)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '1.25rem 1.5rem',
}

export default function NovoOrcamento() {
  const { cabecalho, atualizarCampo, cliente, atualizarCliente, carregandoNumero } = useNovoOrcamento()

  return (
    <Layout>
      <EmitCard
        emailContato={cabecalho.emailContato}
        telefoneContato={cabecalho.telefoneContato}
        onChangeEmail={(v) => atualizarCampo('emailContato', v)}
        onChangeTelefone={(v) => atualizarCampo('telefoneContato', v)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-5 min-w-0">
          <ClienteSection
            nome={cliente.nome}
            cnpj={cliente.cnpj}
            endereco={cliente.endereco}
            responsavel={cliente.responsavel}
            emailTelefone={cliente.emailTelefone}
            onChange={atualizarCliente}
          />

          <div style={sectionStyle}>
            <h2 className="text-[var(--text)] text-sm font-semibold uppercase tracking-wide mb-4">
              Identificacao do Orcamento
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
                  Numero
                </label>
                <input
                  type="text"
                  value={carregandoNumero ? '...' : cabecalho.numero}
                  onChange={(e) => atualizarCampo('numero', e.target.value)}
                  className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
                  Data de emissao
                </label>
                <input
                  type="date"
                  value={cabecalho.dataEmissao}
                  onChange={(e) => atualizarCampo('dataEmissao', e.target.value)}
                  className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
                  Valido ate
                </label>
                <input
                  type="date"
                  value={cabecalho.validade}
                  onChange={(e) => atualizarCampo('validade', e.target.value)}
                  className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
                Titulo / Objeto
              </label>
              <input
                type="text"
                value={cabecalho.titulo}
                onChange={(e) => atualizarCampo('titulo', e.target.value)}
                placeholder="Ex: Instalacao de sistema de monitoramento"
                className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
              />
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 className="text-[var(--text)] text-sm font-semibold uppercase tracking-wide mb-4">
              Itens / Servicos
            </h2>
            <p className="text-[var(--text3)] text-sm">
              Tabela de itens - em breve
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 className="text-[var(--text)] text-sm font-semibold uppercase tracking-wide mb-4">
              Observacoes e Condicoes
            </h2>

            <div className="mb-4">
              <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
                Condicoes de pagamento
              </label>
              <input
                type="text"
                value={cabecalho.condicoesPagamento}
                onChange={(e) => atualizarCampo('condicoesPagamento', e.target.value)}
                placeholder="50 por cento na aprovacao, 50 por cento na entrega"
                className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
              />
            </div>

            <div>
              <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
                Observacoes gerais
              </label>
              <textarea
                value={cabecalho.observacoesGerais}
                onChange={(e) => atualizarCampo('observacoesGerais', e.target.value)}
                rows={3}
                placeholder="Prazo de execucao, garantia, informacoes adicionais"
                className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 self-start flex flex-col gap-5">
          <div style={sectionStyle}>
            <h2 className="text-[var(--text3)] text-xs font-bold uppercase tracking-widest mb-3">
              Configuracoes
            </h2>
            <p className="text-[var(--text3)] text-sm">
              Imposto, margem, desconto - em breve
            </p>
          </div>

          <div style={sectionStyle}>
            <h2 className="text-[var(--text3)] text-xs font-bold uppercase tracking-widest mb-3">
              Resumo
            </h2>
            <p className="text-[var(--text3)] text-sm">
              Totais e resultado - em breve
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
