import { useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import logo from '../assets/infoxtec-logo.jpeg'

const menu = [
  { label: 'Dashboard', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Produtos', path: '/produtos' },
  { label: 'Orcamentos', path: '/orcamentos' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex bg-[var(--navy)]">
      {/* Overlay mobile quando menu aberto */}
      {menuAberto && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          "fixed md:static z-40 top-0 left-0 h-full w-60 border-r border-[var(--border)] bg-[var(--navy)] flex flex-col p-5 transition-transform " +
          (menuAberto ? "translate-x-0" : "-translate-x-full md:translate-x-0")
        }
      >
        <img src={logo} alt="Infoxtec" className="h-8 w-fit mb-8 rounded" />

        <nav className="flex flex-col gap-1 flex-1">
          {menu.map((item) => {
            const ativo = location.pathname === item.path
            const classeBase = "px-3 py-2 rounded-md text-sm transition-colors"
            const classeAtivo = "bg-[var(--green-dim)] text-[var(--green)] font-medium"
            const classeInativo = "text-[var(--text2)] hover:bg-[var(--navy3)] hover:text-[var(--text)]"
            const classeFinal = classeBase + " " + (ativo ? classeAtivo : classeInativo)
            return (
              
              <a
                key={item.path}
                href={item.path}
                className={classeFinal}
                onClick={() => setMenuAberto(false)}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] pt-4">
          <p className="text-[var(--text3)] text-xs mb-2 truncate">
            {session?.user.email}
          </p>
          <button
            onClick={handleLogout}
            className="text-[var(--text2)] text-sm hover:text-[var(--red)] transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Coluna principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
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
