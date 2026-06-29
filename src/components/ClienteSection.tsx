import type { CSSProperties } from 'react'
import ClienteCombobox from './ClienteCombobox'
import type { Cliente } from '../hooks/useClientes'

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

interface Props {
  nome: string
  cnpj: string
  endereco: string
  responsavel: string
  emailTelefone: string
  onChange: (campo: string, valor: string) => void
  clienteVinculado: Cliente | null
  clienteAvulso: boolean
  clienteEditando: boolean
  clienteBusca: string
  onBuscar: (texto: string) => void
  onSelecionar: (cliente: Cliente) => void
  onCadastrarNovo: (nome: string) => void
  onUsarAvulso: (nome: string) => void
  onDesvincular: () => void
  onEditar: () => void
}

export default function ClienteSection({
  nome,
  cnpj,
  endereco,
  responsavel,
  emailTelefone,
  onChange,
  clienteVinculado,
  clienteAvulso,
  clienteEditando,
  clienteBusca,
  onBuscar,
  onSelecionar,
  onCadastrarNovo,
  onUsarAvulso,
  onDesvincular,
  onEditar,
}: Props) {
  const bloqueado = !!clienteVinculado && !clienteEditando

  return (
    <div style={sectionStyle}>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span className="font-sora font-semibold text-[13px] text-[var(--text)]">
          Dados do Cliente
        </span>
        {clienteAvulso && (
          <span className="text-[10px] text-[var(--amber)] bg-[var(--amber-dim)] px-2 py-0.5 rounded-full ml-auto">
            Avulso - nao cadastrado
          </span>
        )}
        {clienteEditando && (
          <span className="text-[10px] text-[var(--green)] bg-[var(--green-dim)] px-2 py-0.5 rounded-full ml-auto">
            Editando cadastro
          </span>
        )}
      </div>

      <div className="mb-3">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)] block mb-1">
          Buscar cliente
        </label>
        <ClienteCombobox
          valorBusca={clienteVinculado ? clienteVinculado.nome : clienteBusca}
          clienteVinculado={clienteVinculado}
          editando={clienteEditando}
          onBuscar={onBuscar}
          onSelecionar={onSelecionar}
          onCadastrarNovo={onCadastrarNovo}
          onUsarAvulso={onUsarAvulso}
          onDesvincular={onDesvincular}
          onEditar={onEditar}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
            Razao Social / Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => onChange('nome', e.target.value)}
            readOnly={bloqueado}
            style={{ ...inputStyle, opacity: bloqueado ? 0.7 : 1 }}
            className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
            CNPJ / CPF
          </label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => onChange('cnpj', e.target.value)}
            readOnly={bloqueado}
            placeholder="00.000.000/0000-00"
            style={{ ...inputStyle, opacity: bloqueado ? 0.7 : 1 }}
            className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
          />
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
            Endereco
          </label>
          <input
            type="text"
            value={endereco}
            onChange={(e) => onChange('endereco', e.target.value)}
            readOnly={bloqueado}
            placeholder="Rua, numero, bairro, cidade - UF"
            style={{ ...inputStyle, opacity: bloqueado ? 0.7 : 1 }}
            className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
            Responsavel
          </label>
          <input
            type="text"
            value={responsavel}
            onChange={(e) => onChange('responsavel', e.target.value)}
            readOnly={bloqueado}
            placeholder="Nome do responsavel"
            style={{ ...inputStyle, opacity: bloqueado ? 0.7 : 1 }}
            className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text3)]">
            E-mail / Telefone
          </label>
          <input
            type="text"
            value={emailTelefone}
            onChange={(e) => onChange('emailTelefone', e.target.value)}
            readOnly={bloqueado}
            placeholder="cliente@email.com"
            style={{ ...inputStyle, opacity: bloqueado ? 0.7 : 1 }}
            className="px-[11px] py-2 text-[var(--text)] outline-none focus:border-[var(--green)] w-full"
          />
        </div>
      </div>
    </div>
  )
}
