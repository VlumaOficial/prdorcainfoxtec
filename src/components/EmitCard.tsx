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
      <img src={logo} alt="Infoxtec" className="h-9 w-auto rounded hidden sm:block" />
      <div className="flex-1">
        <div className="font-sora font-bold text-[13px] text-[var(--text)] mb-0.5">
          INFOXTEC TECNOLOGIA E SERVICOS LTDA
        </div>
        <div className="text-[var(--text2)] text-xs">
          CNPJ: 04.309.223/0001-96
        </div>
        <div className="text-[var(--text2)] text-xs mb-3">
          Rua Silveira Martins, no 27, Cabula - CEP 41150-000, Salvador/BA
        </div>

        <div className="flex gap-3.5 flex-wrap">
          <div className="flex flex-col gap-[3px]">
            <label className="text-[10px] uppercase tracking-wide text-[var(--text3)]">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={telefoneContato}
              onChange={(e) => onChangeTelefone(e.target.value)}
              placeholder="(71) 99999-9999"
              style={{ background: 'var(--navy4)', border: '1px solid var(--border2)', borderRadius: '6px', width: '190px', fontSize: '12px' }}
              className="px-2.5 py-1.5 text-[var(--text)] outline-none focus:border-[var(--green)]"
            />
          </div>
          <div className="flex flex-col gap-[3px]">
            <label className="text-[10px] uppercase tracking-wide text-[var(--text3)]">
              E-mail
            </label>
            <input
              type="text"
              value={emailContato}
              onChange={(e) => onChangeEmail(e.target.value)}
              placeholder="contato@infoxtec.com.br"
              style={{ background: 'var(--navy4)', border: '1px solid var(--border2)', borderRadius: '6px', width: '190px', fontSize: '12px' }}
              className="px-2.5 py-1.5 text-[var(--text)] outline-none focus:border-[var(--green)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
