import type { CSSProperties } from 'react'
const sectionStyle: CSSProperties = {
  background: 'var(--navy2)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '1.25rem 1.5rem',
}

interface Props {
  nome: string
  cnpj: string
  endereco: string
  responsavel: string
  emailTelefone: string
  onChange: (campo: string, valor: string) => void
}

export default function ClienteSection({ nome, cnpj, endereco, responsavel, emailTelefone, onChange }: Props) {
  return (
    <div style={sectionStyle}>
      <h2 className="text-[var(--text)] text-sm font-semibold uppercase tracking-wide mb-4">
        Dados do Cliente
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Razao Social / Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => onChange('nome', e.target.value)}
            placeholder="Empresa Cliente Ltda"
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />
        </div>

        <div>
          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            CNPJ / CPF
          </label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => onChange('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Endereco
          </label>
          <input
            type="text"
            value={endereco}
            onChange={(e) => onChange('endereco', e.target.value)}
            placeholder="Rua, numero, bairro, cidade - UF"
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />
        </div>

        <div>
          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            Responsavel
          </label>
          <input
            type="text"
            value={responsavel}
            onChange={(e) => onChange('responsavel', e.target.value)}
            placeholder="Nome do responsavel"
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />
        </div>

        <div>
          <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
            E-mail / Telefone
          </label>
          <input
            type="text"
            value={emailTelefone}
            onChange={(e) => onChange('emailTelefone', e.target.value)}
            placeholder="cliente@email.com"
            className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
          />
        </div>
      </div>
    </div>
  )
}
