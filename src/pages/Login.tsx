import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/infoxtec-logo.jpeg'

const beneficios = [
  {
    titulo: 'Orçamentos precisos',
    desc: 'Cálculo automático de margem, imposto e desconto, sem erros de planilha',
  },
  {
    titulo: 'Catálogo reutilizável',
    desc: 'Cadastre produtos e serviços uma vez, use em quantos orçamentos quiser',
  },
  {
    titulo: 'Histórico completo',
    desc: 'Consulte clientes e propostas anteriores em segundos',
  },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--navy)]">
      <div className="hidden md:flex flex-col justify-center px-16 w-1/2 border-r border-[var(--border)]">
        <img src={logo} alt="Infoxtec" className="h-10 w-fit mb-8 rounded" />
        <p className="text-[var(--text2)] text-lg mb-10">
          Orçamentos certos, sempre
        </p>
        <div className="flex flex-col gap-7">
          {beneficios.map((b) => (
            <div key={b.titulo}>
              <h3 className="text-[var(--text)] font-semibold text-base mb-1">
                {b.titulo}
              </h3>
              <p className="text-[var(--text2)] text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <img src={logo} alt="Infoxtec" className="h-9 w-fit mb-8 md:hidden rounded" />
          <h1 className="text-[var(--text)] text-2xl font-semibold mb-1">
            Bem-vindo de volta
          </h1>
          <p className="text-[var(--text2)] text-sm mb-8">
            Entre para gerenciar seus orçamentos
          </p>

          <form onSubmit={handleLogin}>
            <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 mb-4 text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors"
            />

            <label className="block text-[var(--text3)] text-xs uppercase tracking-wide mb-1">
              Senha
            </label>
            <div className="relative mb-2">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full bg-[var(--navy4)] border border-[var(--border2)] rounded-md px-3 py-2.5 pr-10 text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text2)] text-xs"
              >
                {mostrarSenha ? 'ocultar' : 'mostrar'}
              </button>
            </div>

            {erro && <p className="text-[var(--red)] text-sm mb-3">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-gradient-to-br from-[var(--green-dark)] to-[var(--green)] text-white rounded-md py-2.5 font-semibold mt-2 disabled:opacity-60 transition-opacity"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-[var(--text3)] text-xs mt-10">
            Desenvolvido por{' '}
            <span className="text-[var(--green)] font-semibold">VLUMA</span>
          </p>
        </div>
      </div>
    </div>
  )
}
