import React, { useState } from 'react'
import { login } from '../services/auth'

function Login({ onLogin }) {
  const [credenciais, setCredenciais] = useState({
    username: '',
    password: ''
  })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setCredenciais(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const resultado = await login(credenciais.username, credenciais.password)

    if (resultado.success) {
      onLogin()
    } else {
      setErro(resultado.error)
    }

    setCarregando(false)
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{width: '100%', maxWidth: '400px'}}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="bi bi-robot fs-1 text-primary"></i>
            <h2 className="mt-2">Sistema RPA</h2>
            <p className="text-muted">Faça login para continuar</p>
          </div>

          {erro && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                <i className="bi bi-person me-2"></i>
                Usuário
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                value={credenciais.username}
                onChange={handleChange}
                required
                disabled={carregando}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                <i className="bi bi-lock me-2"></i>
                Senha
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={credenciais.password}
                onChange={handleChange}
                required
                disabled={carregando}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </span>
                  Entrando...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Entrar
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              Usuário padrão: admin / Senha: admin123
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
