import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { session } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[var(--navy)] p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[var(--text)] text-xl font-semibold">
          Sistema de Orçamento Infoxtec
        </h1>
        <button
          onClick={handleLogout}
          className="text-[var(--text2)] text-sm hover:text-[var(--red)] transition-colors"
        >
          Sair
        </button>
      </div>

      <p className="text-[var(--text2)]">
        Logado como: {session?.user.email}
      </p>
    </div>
  )
}
