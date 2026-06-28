import logo from '../assets/infoxtec-logo.jpeg'

interface Props {
  emailContato: string
  telefoneContato: string
  onChangeEmail: (v: string) => void
  onChangeTelefone: (v: string) => void
}

export default function EmitCard({ emailContato, telefoneContato, onChangeEmail, onChangeTelefone }: Props) {
  return (
    <div
      className="flex gap-5 items-start mb-5 p-4 sm:p-5"
      style={{
        background: 'var(--navy3)',
        border: '1px solid var(--border2)',
        borderLeft: '3px solid var(--green)',
        borderRadius: '14px',
      }}
    >
      <img src={logo} alt="Infoxtec" className="h-10 w-auto rounded hidden sm:block" />
      <div className="flex-1">
        <div className="text-[var(--text)] font-bold text-base">
          INFOXTEC TECNOLOGIA E SERVICOS LTDA
        </div>
        <div className="text-[var(--text2)] text-sm">
          CNPJ: 04.309.223/0001-96
        </div>
        <div className="text-[var(--text2)] text-sm mb-3">
          Rua Silveira Martins, no 27, Cabula - CEP 41150-000, Salvador/BA
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={telefoneContato}
              onChange={(e) => onChangeTelefone(e.target.value)}
              placeholder="(71) 99999-9999"
              className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
            />
          </div>
          <div>
            <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
              E-mail
            </label>
            <input
              type="text"
              value={emailContato}
              onChange={(e) => onChangeEmail(e.target.value)}
              placeholder="contato@infoxtec.com.br"
              className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 text-[var(--text)] outline-none focus:border-[var(--green)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
