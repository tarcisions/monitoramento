import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

function Header() {
  const { logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <h1>Sistema RPA</h1>
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            Dashboard
          </Link>
          <Link to="/robos" className={isActive('/robos') ? 'active' : ''}>
            Robôs
          </Link>
          <Link to="/jobs" className={isActive('/jobs') ? 'active' : ''}>
            Jobs
          </Link>
          <Link to="/execucoes" className={isActive('/execucoes') ? 'active' : ''}>
            Execuções
          </Link>
          <Link to="/monitoramento" className={isActive('/monitoramento') ? 'active' : ''}>
            Monitoramento
          </Link>
          <button onClick={logout} className="btn btn-danger" style={{ marginLeft: 'auto' }}>
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header

