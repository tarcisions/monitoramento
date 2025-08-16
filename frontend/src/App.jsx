import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Robots from './pages/Robots'
import Jobs from './pages/Jobs'
import Executions from './pages/Executions'
import { isAuthenticated } from './services/auth'

function App() {
  const [autenticado, setAutenticado] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const verificarAutenticacao = () => {
      const auth = isAuthenticated()
      setAutenticado(auth)
      setCarregando(false)
    }

    verificarAutenticacao()
  }, [])

  if (carregando) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '100vh'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!autenticado) {
    return <Login onLogin={() => setAutenticado(true)} />
  }

  return (
    <Layout onLogout={() => setAutenticado(false)}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/robos" element={<Robots />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/execucoes" element={<Executions />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Layout>
  )
}

export default App
