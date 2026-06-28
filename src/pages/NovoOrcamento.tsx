import Layout from '../components/Layout'
import { useNovoOrcamento } from '../hooks/useNovoOrcamento'

export default function NovoOrcamento() {
  const { cabecalho, atualizarCampo, carregandoNumero } = useNovoOrcamento()

  return (
    <Layout>
      <h1 className="text-[var(--text)] text-2xl font-semibold mb-1">
        Novo Orcamento
      </h1>
      <p className="text-[var(--text2)] text-sm mb-6">
        Preencha os dados do orcamento
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Coluna esquerda - formulario */}
        <div className="flex flex-col gap-6 min-w-0">
          <div className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="text-[var(--text)] text-sm font-semibold uppercase tracking-wide mb-4">
              Identificacao
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

            <div className="mb-4">
              <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
                Cliente
              </label>
              <div className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text3)]">
                Selecionar cliente - em breve
              </div>
            </div>

            <div>
              <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
                Titulo
              </label>
              <input
                type="text"
                value={cabecalho.titulo}
                onChange={(e) => atualizarCampo('titulo', e.target.value)}
                placeholder="Instalacao de sistema de monitoramento"
                className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
              />
            </div>
          </div>

          <div className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="text-[var(--text)] text-sm font-semibold uppercase tracking-wide mb-4">
              Itens / Servicos
            </h2>
            <p className="text-[var(--text3)] text-sm">
              Tabela de itens - em breve (etapa 5.3)
            </p>
          </div>

          <div className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-5">
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

        {/* Coluna direita - resumo financeiro (fixo no scroll, desktop) */}
        <div className="lg:sticky lg:top-6 self-start">
          <div className="bg-[var(--navy2)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="text-[var(--text)] text-sm font-semibold uppercase tracking-wide mb-4">
              Resumo
            </h2>
            <p className="text-[var(--text3)] text-sm">
              Configuracoes e totais - em breve (etapa 5.5)
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
