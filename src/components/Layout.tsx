import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import logo from '../assets/infoxtec-logo.jpeg'

const menu = [
  {
    label: 'Dashboard',
    path: '/',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Clientes',
    path: '/clientes',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Produtos',
    path: '/produtos',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Orçamentos',
    path: '/orcamentos',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  // Colapso so e permitido na tela de Orcamento
  const emOrcamento = location.pathname.startsWith('/orcamentos')

  // Estado de colapso. Ao entrar em Orcamento, colapsa automaticamente.
  const [colapsada, setColapsada] = useState<boolean>(emOrcamento)

  // Sempre que a rota mudar para Orcamento, colapsa; ao sair, expande.
  useEffect(() => {
    setColapsada(emOrcamento)
  }, [emOrcamento])

  const efetivamenteColapsada = colapsada && emOrcamento

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const larguraSidebar = efetivamenteColapsada ? 'w-14' : 'w-60'

  return (
    <div className="min-h-screen flex bg-[var(--navy)]">
      {menuAberto && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside
        className={
          "fixed md:static z-40 top-0 left-0 h-screen border-r border-[var(--border)] bg-[var(--navy)] flex flex-col transition-all " +
          larguraSidebar + " " +
          (efetivamenteColapsada ? "p-2" : "p-5") + " " +
          (menuAberto ? "translate-x-0" : "-translate-x-full md:translate-x-0")
        }
      >
        <div className={"flex items-center mb-6 " + (efetivamenteColapsada ? "justify-center" : "justify-between")}>
          {!efetivamenteColapsada && <img src={logo} alt="Infoxtec" className="h-8 w-fit rounded" />}
          {emOrcamento && (
          <button
            type="button"
            onClick={() => setColapsada(!colapsada)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded text-[var(--text2)] hover:bg-[var(--navy3)]"
            title={efetivamenteColapsada ? 'Expandir menu' : 'Colapsar menu'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={efetivamenteColapsada ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
          )}
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {menu.map((item) => {
            const ativo = location.pathname === item.path || (item.path.startsWith('/orcamentos') && location.pathname.startsWith('/orcamentos'))
            const classeBase = "rounded-md text-sm transition-colors flex items-center "
            const classePadding = efetivamenteColapsada ? "justify-center p-2" : "px-3 py-2 gap-2.5"
            const classeAtivo = "bg-[var(--green-dim)] text-[var(--green)] font-medium"
            const classeInativo = "text-[var(--text2)] hover:bg-[var(--navy3)] hover:text-[var(--text)]"
            const classeFinal = classeBase + classePadding + " " + (ativo ? classeAtivo : classeInativo)
            return (
              
              <a
                key={item.path}
                href={item.path}
                className={classeFinal}
                onClick={() => setMenuAberto(false)}
                title={efetivamenteColapsada ? item.label : undefined}
              >
                {item.icon}
                {!efetivamenteColapsada && <span>{item.label}</span>}
              </a>
            )
          })}
        </nav>

        <div className={"border-t border-[var(--border)] " + (efetivamenteColapsada ? "pt-2" : "pt-4")}>
          {!efetivamenteColapsada && (
            <p className="text-[var(--text3)] text-xs mb-2 truncate">
              {session?.user.email}
            </p>
          )}
          <button
            onClick={handleLogout}
            className={
              "text-[var(--text2)] hover:text-[var(--red)] transition-colors flex items-center " +
              (efetivamenteColapsada ? "justify-center w-full p-2" : "text-sm")
            }
            title="Sair"
          >
            {efetivamenteColapsada ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            ) : (
              <span className="text-sm">Sair</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border)]">
          <img src={logo} alt="Infoxtec" className="h-7 w-fit rounded" />
          <button
            onClick={() => setMenuAberto(true)}
            className="text-[var(--text)] p-2"
            aria-label="Abrir menu"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
