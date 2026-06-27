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

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex bg-[var(--navy)]">
      <aside className="w-60 border-r border-[var(--border)] flex flex-col p-5">
        <img src={logo} alt="Infoxtec" className="h-8 w-fit mb-8 rounded" />

        <nav className="flex flex-col gap-1 flex-1">
          {menu.map((item) => {
            const ativo = location.pathname === item.path
            const classeBase = "px-3 py-2 rounded-md text-sm transition-colors"
            const classeAtivo = "bg-[var(--green-dim)] text-[var(--green)] font-medium"
            const classeInativo = "text-[var(--text2)] hover:bg-[var(--navy3)] hover:text-[var(--text)]"
            const classeFinal = classeBase + " " + (ativo ? classeAtivo : classeInativo)
            return (
              <a key={item.path} href={item.path} className={classeFinal}>
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

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  )
}
