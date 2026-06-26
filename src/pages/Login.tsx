import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    setCarregando(false)

    if (error) {
      setErro('Email ou senha inválidos')
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--navy)]">
      <form
        onSubmit={handleLogin}
        className="bg-[var(--navy2)] border border-[var(--border2)] rounded-2xl p-8 w-full max-w-sm"
      >
        <h1 className="text-[var(--text)] text-xl font-semibold mb-6">
          Entrar
        </h1>

        <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-4 text-[var(--text)] outline-none focus:border-[var(--green)]"
        />

        <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
          Senha
        </label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2 mb-4 text-[var(--text)] outline-none focus:border-[var(--green)]"
        />

        {erro && (
          <p className="text-[var(--red)] text-sm mb-4">{erro}</p>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md py-2 font-semibold disabled:opacity-60"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
