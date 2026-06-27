import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Produtos from './pages/Produtos'

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen bg-[var(--navy)] flex items-center justify-center">
        <p className="text-[var(--text2)]">Carregando...</p>
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function RotaPublica({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen bg-[var(--navy)] flex items-center justify-center">
        <p className="text-[var(--text2)]">Carregando...</p>
      </div>
    )
  }

  if (autenticado) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RotaPublica>
              <Login />
            </RotaPublica>
          }
        />
        <Route
          path="/"
          element={
            <RotaProtegida>
              <Dashboard />
            </RotaProtegida>
          }
        />
        <Route
          path="/clientes"
          element={
            <RotaProtegida>
              <Clientes />
            </RotaProtegida>
          }
        />
        <Route
          path="/produtos"
          element={
            <RotaProtegida>
              <Produtos />
            </RotaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
