import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { fmtBR } from '../lib/numeros'
import { useAcoesPedido } from '../hooks/useAcoesPedido'

interface ItemDisponivel {
  id: string
  descricao: string
  qtd: number
  custo_unit: number
}

interface Props {
  orcamentoId: string
  onCriado: (pedidoId: string) => void
  onCancelar: () => void
}

const chkBoxStyle: CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  fontSize: '11px',
}

function ChkToggle({ marcado, onToggle }: { marcado: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        ...chkBoxStyle,
        background: marcado ? 'var(--green)' : 'var(--navy4)',
        border: marcado ? '1.5px solid var(--green)' : '1.5px solid var(--border2)',
      }}
    >
      {marcado && <span style={{ color: '#fff' }}>✓</span>}
    </div>
  )
}

// Tela de selecao de itens para gerar um pedido a partir de um orcamento aprovado.
// Abre automaticamente ao aprovar (com tudo pre-marcado) e tambem via botao
// "Novo Pedido (itens restantes)" para pedidos parciais adicionais.
export default function SelecaoItensPedido({ orcamentoId, onCriado, onCancelar }: Props) {
  const [itens, setItens] = useState<ItemDisponivel[]>([])
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState<string | null>(null)
  const { criarPedido, salvando, erro } = useAcoesPedido()

  useEffect(() => {
    let ativo = true
    async function carregar() {
      setCarregando(true)
      const { data, error } = await supabase.rpc('itens_disponiveis_orcamento', {
        p_orcamento_id: orcamentoId,
      })
      if (!ativo) return
      if (error) {
        setErroCarga(error.message)
      } else {
        const lista = (data || []) as ItemDisponivel[]
        setItens(lista)
        setSelecionados(new Set(lista.map((i) => i.id)))
      }
      setCarregando(false)
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [orcamentoId])

  function alternar(id: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  async function handleConfirmar() {
    const ids = Array.from(selecionados)
    if (ids.length === 0) return
    const pedidoId = await criarPedido(orcamentoId, ids)
    if (pedidoId) onCriado(pedidoId)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onCancelar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--navy2)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <h2 style={{ color: 'var(--text)', fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
          Gerar Pedido
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '18px' }}>
          Selecione os itens que farao parte deste pedido. Itens desmarcados ficam disponiveis
          para um pedido futuro (entrega parcial).
        </p>

        {carregando && <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Carregando itens...</p>}
        {erroCarga && <p style={{ color: 'var(--red)', fontSize: '13px' }}>{erroCarga}</p>}

        {!carregando && !erroCarga && itens.length === 0 && (
          <p style={{ color: 'var(--text2)', fontSize: '13px' }}>
            Nao ha itens disponiveis — todos ja estao vinculados a algum pedido.
          </p>
        )}

        {!carregando && itens.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3"
                style={{
                  background: 'var(--navy3)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                <ChkToggle marcado={selecionados.has(item.id)} onToggle={() => alternar(item.id)} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500 }}>{item.descricao}</p>
                  <p style={{ color: 'var(--text3)', fontSize: '11px' }}>
                    Qtd {item.qtd} · {fmtBR(item.custo_unit)}/un
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {erro && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{erro}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={salvando || selecionados.size === 0}
            style={{
              flex: 1,
              background: 'var(--green)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: salvando || selecionados.size === 0 ? 'not-allowed' : 'pointer',
              opacity: salvando || selecionados.size === 0 ? 0.6 : 1,
            }}
          >
            {salvando ? 'Gerando...' : `Gerar Pedido (${selecionados.size} ${selecionados.size === 1 ? 'item' : 'itens'})`}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={salvando}
            style={{
              background: 'transparent',
              color: 'var(--text)',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border2)',
              cursor: salvando ? 'not-allowed' : 'pointer',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
