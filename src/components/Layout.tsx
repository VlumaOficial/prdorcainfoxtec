import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import logo from '../assets/infoxtec-logo.jpeg'

const menu = [
  { label: 'Dashboard', path: '/', ativo: true },
  { label: 'Clientes', path: '/clientes', ativo: false },
  { label: 'Produtos', path: '/produtos', ativo: false },
  { label: 'Orçamentos', path: '/orcamentos', ativo: false },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { session } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex bg-[var(--navy)]">
      <aside className="w-60 border-r border-[var(--border)] flex flex-col p-5">
        <img src={logo} alt="Infoxtec" className="h-8 w-fit mb-8 rounded" />

        <nav className="flex flex-col gap-1 flex-1">
          {menu.map((item) => (
            
              key={item.path}
              href={item.path}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                item.ativo
                  ? 'bg-[var(--green-dim)] text-[var(--green)] font-medium'
                  : 'text-[var(--text2)] hover:bg-[var(--navy3)] hover:text-[var(--text)]'
              }`}
            >
              {item.label}
            </a>
          ))}
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
